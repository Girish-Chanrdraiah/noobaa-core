#!/bin/bash

MONGO_PROGRAM="mongodb"
MONGO_SHELL="/usr/bin/mongo nbcore"
LOG_FILE="/var/log/noobaa_deploy_wrapper.log"

function deploy_log {
	if [ "$1" != "" ]; then
        local now=$(date)
        echo "${now} ${1}" >> ${LOG_FILE}
        logger -t UPGRADE -p local0.warn "${1}"
	fi
}

function set_mongo_cluster_mode {
    MONGO_PROGRAM="mongors-shard1"
	RS_SERVERS=`grep MONGO_RS_URL /root/node_modules/noobaa-core/.env | cut -d'/' -f 3`
    MONGO_SHELL="/usr/bin/mongo --host shard1/${RS_SERVERS} nbcore"
}

function check_mongo_status {
    # check the supervisor status first
    local super_status=$(supervisorctl status ${MONGO_PROGRAM})
    local super_state=$(awk '{ print $2 }' <<< $super_status)
    if [ "$super_state" != "RUNNING" ]
    then
        deploy_log "check_mongo_status: Supervisor status not running: $super_status"
        return 1
    fi

    # even if the supervisor reports the service is running try to connect to it
    local mongo_status
    # beware not to run "local" in the same line changes the exit code
    mongo_status=$(${MONGO_SHELL} --quiet --eval 'quit(!db.serverStatus().ok)')
    if [ $? -ne 0 ]
    then
        deploy_log "check_mongo_status: Failed to connect to mongod: $mongo_status"
        return 1
    fi

    return 0
}

function wait_for_mongo {
    while ! check_mongo_status
    do
        deploy_log "wait_for_mongo: Waiting for mongo (sleep 5)"
        sleep 5
    done
}
