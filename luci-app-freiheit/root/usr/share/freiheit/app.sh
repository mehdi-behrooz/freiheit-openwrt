#!/bin/sh

. /lib/functions.sh
. /usr/share/freiheit/log.sh

XRAY=/usr/bin/xray
XRAY_TEMPLATE_DIR=/etc/freiheit/xray/templates/
XRAY_CONFIG_DIR=/etc/freiheit/xray/conf/
XRAY_PID=/var/run/freiheit-xray.pid
XRAY_LOG=/var/log/xray.log
XRAY_LOCATION_ASSET=/usr/share/xray/

XRAY_JSON_GENERATOR="/usr/bin/xray-json-generator"

NFT_RULES_FILE="/etc/freiheit/nftables/rules.nft"

STARTING_STATE_FILE="/var/run/freiheit.starting"

_find_node_with_id() {
    config_get id "$1" id
    if [ "$id" == "$2" ]; then
        echo "$1"
    fi
}

_update_node_information() {
    config_get protocol $1 protocol
    if [[ -n "$protocol" ]]; then
        return 0
    fi
    log 'check_new_nodes' "New node found with section_id = $1"
    config_get type $1 type
    case "$type" in
        uri)
            config_get uri $1 uri
            json="$($XRAY_JSON_GENERATOR "$uri")"
            ;;
        file)
            config_get file $1 file
            if [[ ! -e "$file" ]]; then
                log 'check_new_nodes' "File not found: '$file'"
                return 0
            fi
            json="$(cat "$file")"
            ;;
        *)
            log 'check_new_nodes' "Uknown node type: '$type'"
            return 1
            ;;
    esac
    protocol=$(echo $json | jq -r ".outbounds[0].protocol")
    server=$(echo $json | jq -r '.outbounds[0].settings.vnext[0].address // "-"')
    uci -q set freiheit.$1.protocol="$protocol"
    uci -q set freiheit.$1.server="$server"
}

_add_xray_routing_rule() {
    config_get type $1 type
    config_get content $1 content
    config_get target $1 target
    tmp=$(mktemp)
    jq -n '{ "type":"field" }' >$tmp
    jq --arg t "$target" '.outboundTag = $t' $tmp | sponge $tmp
    for p in ${content//,/ }; do
        jq --arg f $type --arg p $p '.[$f] |= . + [$p]' $tmp | sponge $tmp
    done
    jq --argfile r "$tmp" '.routing.rules |= . + [$r]' "$2" | sponge "$2"
    rm -f $tmp
}

_add_xray_default_routing_rule() {
    config_get target global default_routing
    [[ -z $target ]] && target=proxy
    tmp=$(mktemp)
    jq -n '{ "type":"field", "port":"0-65535" }' >$tmp
    jq --arg t $target '.outboundTag = $t' $tmp | sponge $tmp
    jq --argfile r "$tmp" '.routing.rules |= . + [$r]' "$1" | sponge "$1"
    rm -f $tmp
}

check_new_nodes() {
    log 'check_new_nodes' "Looking for new nodes..."
    config_load freiheit
    config_foreach _update_node_information node
    uci commit freiheit
}

start_xray() {
    if [ -e $XRAY_PID ]; then
        log 'start_xray' "xray is already running. Exiting."
        return 0
    fi
    mkdir -p $XRAY_CONFIG_DIR
    rm -rf $XRAY_CONFIG_DIR/*
    config_load freiheit
    config_get active_node_id global active_node_id
    if [[ -z $active_node_id ]]; then
        log 'start_xray' "No active node is selected. Exiting."
        return 0
    fi
    node=$(config_foreach _find_node_with_id node $active_node_id)
    if [[ -z $node ]]; then
        log 'start_xray' "Active node with id = '$active_node_id' not found. Exiting."
        return 1
    fi
    config_get remark $node remark
    config_get type $node type
    log 'start_xray' "Using active node '$remark' with type '$type' ..."
    case "$type" in
        uri)
            config_get uri $node uri
            log 'start_xray' "Generating json for config '$remark'..."
            cp $XRAY_TEMPLATE_DIR/*.json $XRAY_CONFIG_DIR
            $XRAY_JSON_GENERATOR "$uri" \
                | jq '{outbounds}' \
                | jq '.outbounds[].tag = "proxy"' \
                | jq '.outbounds[].streamSettings.sockopt.mark = 2' \
                >$XRAY_CONFIG_DIR/21-outbound-proxy.json
            routing_file="$XRAY_CONFIG_DIR/31-routing.json"
            config_foreach _add_xray_routing_rule route $routing_file
            _add_xray_default_routing_rule $routing_file
            ;;
        file)
            config_get file $node file
            log 'start_xray' "Using custom json file '$file'..."
            if [[ ! -e "$file" ]]; then
                log 'start_xray' "File not found: '$file'... Exiting."
                return 1
            fi
            cp "$file" $XRAY_CONFIG_DIR/xray.json
            cp $XRAY_TEMPLATE_DIR/11-inbound-socks.json $XRAY_CONFIG_DIR
            cp $XRAY_TEMPLATE_DIR/12-inbound-transparent.json $XRAY_CONFIG_DIR
            ;;
        *)
            log 'start_xray' "Unknow node type: '$type'. Exiting."
            return 1
            ;;
    esac
    log 'start_xray' "Starting xray..."
    export XRAY_LOCATION_ASSET
    xray_test_output="$($XRAY run -confdir $XRAY_CONFIG_DIR -test 2>&1)"
    xray_test_code=$?
    if [[ "$xray_test_code" -eq 0 ]]; then
        $XRAY run -confdir $XRAY_CONFIG_DIR 1>$XRAY_LOG 2>&1 &
        echo $! >$XRAY_PID
    else
        log 'start_xray' "Starting xray failed:"
        logblock 'start_xray' "$xray_test_output"
    fi
}

stop_xray() {
    if [ ! -e $XRAY_PID ]; then
        log 'stop_xray' "xray is not running. Exiting."
        return 0
    fi
    log 'stop_xray' "Stopping xray: "
    kill $(cat $XRAY_PID)
    rm -f $XRAY_PID
    rm -f $XRAY_CONFIG_DIR/outbounds.json
}

start_nft() {
    log 'start_nft' "Adding routing tables..."
    ip route add local default dev lo table 100
    while ip rule del fwmark 1 table 100 2>/dev/null; do :; done
    ip rule add fwmark 1 table 100
    log 'start_nft' "Generating nft configurations..."
    >$NFT_RULES_FILE
    config_load freiheit
    for interface in $(config_get network interfaces); do
        echo "ip protocol {tcp, udp} meta iifname $interface meta mark set 1" >>$NFT_RULES_FILE
    done
    for sourceip in $(config_get network sourceips); do
        echo "ip protocol {tcp, udp} ip saddr $sourceip meta mark set 1" >>$NFT_RULES_FILE
    done
    log 'start_nft' "Restarting the firewall..."
    /etc/init.d/firewall restart
}

stop_nft() {
    log 'stop_nft' "Deleting routing tables..."
    ip route del local default dev lo table 100 2>/dev/null
    ip rule del fwmark 1 table 100 2>/dev/null
    log 'stop_nft' "Clearing nft configurations..."
    > $NFT_RULES_FILE
    log 'start_nft' "Restarting the firewall..."
    /etc/init.d/firewall restart
}

_set_starting_state() {
    touch $STARTING_STATE_FILE
}

_unset_starting_state() {
    rm -f $STARTING_STATE_FILE
}

_check_starting_state() {
    [[ -e $STARTING_STATE_FILE ]]
}

start() {
    trap '_unset_starting_state; stop_nft' EXIT SIGINT SIGTERM
    _set_starting_state
    check_new_nodes
    start_xray
    start_nft
    _unset_starting_state
    log 'start' "Service started successfully."
}

stop() {
    stop_nft
    stop_xray
    log 'stop' "Service stopped successfully."
}

check() {
    check_new_nodes
}

hibernate() {
    sleep infinity &
    wait
}

case $1 in

start)
    start 1>>$LOG_FILE 2>&1
    hibernate
    ;;

stop)
    stop 1>>$LOG_FILE 2>&1
    ;;

check)
    check 1>>$LOG_FILE 2>&1
    ;;

is_starting)
    _check_starting_state 1>>$LOG_FILE 2>&1
    ;;

esac

