#!/bin/bash

nohup node dist/index.js > nohup.log &

port=${1:-80}
count=0
count_max=20

until $(curl --output /dev/null --silent --head --fail http://localhost:$port/_/health); do
    sleep 3
    count=$((count+1))
    if ! pgrep  -x node > /dev/null; then
        exit 1
    fi
    if [ $count -gt $count_max ]; then
        pkill node
        exit 1
    fi
done