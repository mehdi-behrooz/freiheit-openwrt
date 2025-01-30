'use strict';
'require dom';
'require form';
'require poll';
'require view';
'require ui';
'require freiheit.rpcclient as rpcclient';
'require freiheit.utils as utils';
'require freiheit.widgets as widgets';

return view.extend({

    load: function () {
        utils.addCSS();
    },

    onBodyLoad: function () {
        poll.add(this.getServiceStatus.bind(this));
    },

    onButtonClick: function (action) {
        widgets.Spinner.show(`${action}ing the server...`);
        rpcclient.perform_service_init(action.toLowerCase())
            .then(utils.wait.bind(this, 3000))
            .then(this.getServiceStatus.bind(this))
            .catch(err => {
                ui.addNotification(null, _('${action}ing the server failed: ') + err.message, 'error');
                console.log(('%s').format(err));

            })
            .finally(() => {
                widgets.Spinner.hide()
            });
    },

    getServiceStatus: function () {
        rpcclient.get_service_status()
            .then(result => {
                for (let key in result) {
                    this.updateStatusText(key, result[key]);
                }
            })
            .catch(err => {
                console.log(('%s').format(err));
                ui.addNotification(null, _('Error while retrieving service status: ') + err.message, 'error');
            })
    },

    updateStatusText: function (key, value) {
        let span = document.querySelector(`#status-${key}`);
        let color = (!value || value == "waiting") ? "grey" : (value == "off") ? "red" : "green";
        let text = (value == "off") ? "Stopped" : (value == "on") ? "Running" : (value == "waiting") ? "Waiting..." : value || "-";
        dom.content(span, text);
        span.style.color = color;
    },

    StatusLabel: form.DummyValue.extend({

        renderWidget: function () {
            return E('span', { id: `status-${this.option}`, 'class': 'cbi-value-field cbi-value-textfield' }, '-');
        }

    }),

    render: function (data) {

        var m, s, o;

        m = new form.Map('freiheit', _(''), _(''))

        s = m.section(widgets.VerticalSection, _('Service Status'), _(''));
        o = s.option(this.StatusLabel, 'freiheit', _('Main Service'));
        o = s.option(this.StatusLabel, 'xray', _('Xray'));
        o = s.option(this.StatusLabel, 'nft', _('Applied to'));
        o = s.option(this.StatusLabel, 'ip', _('IP'));

        o = s.option(widgets.MultiValue, 'multi', _(' '));
        for (const action of ['Start', 'Stop', 'Restart']) {
            let oo = o.addChild(form.Button, action.toLowerCase());
            oo.inputtitle = _(`${action} Service`);
            oo.inputstyle = 'apply';
            oo.onclick = this.onButtonClick.bind(this, action);
        }

        return m.render()
            .finally(this.onBodyLoad.bind(this));

    }

});
