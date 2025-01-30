'use strict';
'require baseclass';
'require rpc';

return baseclass.extend({

    fetch_logs: rpc.declare({
        object: "luci.freiheit",
        method: "fetch_logs",
        params: ["n"],
    }),

    clear_logs: rpc.declare({
        object: "luci.freiheit",
        method: "clear_logs",
        params: [],
    }),

    get_service_status: rpc.declare({
        object: 'luci.freiheit',
        method: 'get_service_status',
        params: []
    }),

    perform_service_init: rpc.declare({
        object: 'luci.freiheit',
        method: 'perform_service_init',
        params: ["action"]
    }),

    download_subscriptions: rpc.declare({
        object: "luci.freiheit",
        method: "download_subscriptions",
        params: [],
    }),

    delete_nodes: rpc.declare({
        object: "luci.freiheit",
        method: "delete_nodes",
        params: [],
    }),

    set_active_node: rpc.declare({
        object: "luci.freiheit",
        method: "set_active_node",
        params: ["id"],
    }),


});
