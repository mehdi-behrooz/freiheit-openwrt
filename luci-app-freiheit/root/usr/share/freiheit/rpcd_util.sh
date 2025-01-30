#!/bin/sh

. /lib/functions.sh
. /usr/share/libubox/jshn.sh
. /usr/share/freiheit/log.sh

methods=""

define_method() {
    method=$1
    shift
    args=$@
    methods="$methods$method "
    eval "export args_${method}=\"$@\""
}

list_methods() {
    json_init
    for method in $methods; do
        json_add_object "$method"
        args=$(eval "echo \$args_${method}")
        for arg in $args; do
            json_add_string "$arg" "$arg"
        done
        json_close_object
    done
    json_dump
    json_cleanup
}

call_method() {
    args=$(eval "echo \$args_${1}")
    json_load "$2"
    values=""
    for arg in $args; do
        json_get_var value "$arg"
        values="$values$value "
    done
    json_cleanup
    $1 $values
}

run_methods() {
    case "$1" in
        list)
            list_methods 2>>$LOG_FILE
            ;;
        call)
            read -r input
            call_method "$2" "$input" 2>>$LOG_FILE
            ;;
    esac
}