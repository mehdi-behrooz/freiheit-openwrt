#!/bin/sh

url_decode() {
    printf '%b\n' "$(sed -e 's/+/ /' -e 's/%/\\x/g' )"
}

short_uuid() {
    head /dev/urandom | tr -dc A-Za-z0-9 | head -c8
}