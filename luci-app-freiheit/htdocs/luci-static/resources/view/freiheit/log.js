'use strict';
'require dom';
'require poll';
'require view';
'require freiheit.rpcclient as rpcclient';
'require freiheit.widgets as widgets';
'require freiheit.utils as utils';

return view.extend({

    load: function () {
        utils.addCSS();
    },

    clearLogs: function () {
        rpcclient.clear_logs()
            .then(() => {
                poll.stop();
                poll.start();
            })
            .catch(err => {
                console.log(err);
            })
    },

    fetchLogs: function (logArea, loading) {
        loading.style.visibility = 'visible';
        rpcclient.fetch_logs('1000')
            .then(result => result.log)
            .catch(err => {
                return _('%s').format(err);
            })
            .then(text => {
                let alreayScrolledToBottom = (logArea.scrollTop + logArea.clientHeight >= logArea.scrollHeight);
                dom.content(logArea, text);
                if (alreayScrolledToBottom) {
                    logArea.scrollTop = logArea.scrollHeight;
                }
            })
            .finally(() => {
                loading.style.visibility = 'hidden';
            })
    },

    render: function (data) {
        let clearButton = E('button', { 'class': 'cbi-button cbi-button-reset', 'click': this.clearLogs }, "Clear Logs");

        let loading = E('div', { 'class': 'loading' }, E('img', { 'src': L.resource(['icons/loading.gif']) }));
        let logArea = E('pre', { 'class': 'log' });
        let container = E('div', { 'class': 'log-container' }, [loading, logArea]);

        poll.add(this.fetchLogs.bind(this, logArea, loading));

        let view = E('div', { style: 'display: flex; flex-direction: column; gap: 10px; align-items: end;' }, [
            clearButton, container]);

        return view;
    },

});

