#!/bin/sh

LOG_FILE=/var/log/freiheit.log

log() {
    date="$(date '+%Y-%m-%d %H:%M:%S')"
    module="$1():"
    shift
    message="${@}"
    echo "$date $module ${@}" >>$LOG_FILE
}

logblock() {
    date="$(date '+%Y-%m-%d %H:%M:%S')"
    module="$1():"
    shift
    message="${@}"
    echo "$date $module" >> $LOG_FILE
    echo "${@}" | sed 's/^/    /'
}