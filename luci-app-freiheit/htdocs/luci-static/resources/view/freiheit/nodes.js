'use strict';
'require dom';
'require form';
'require uci';
'require ui';
'require view';
'require freiheit.utils as utils';
'require freiheit.widgets as widgets';
'require freiheit.rpcclient as rpcclient';


return view.extend({

    load: function () {
        utils.addCSS();
        return Promise.all([
            uci.load('freiheit'),
        ]);
    },

    setActiveNode: function (map, id) {
        widgets.SaveChangesPopup.ensureChangesAreSaved()
            .then(() => {
                widgets.Spinner.show('Setting active node...');
            })
            .then(rpcclient.set_active_node.bind(this, id))
            .then(L.bind(uci.unload, uci, map.config))
            .then(L.bind(uci.load, uci, map.config))
            .then(L.bind(map.load, map))
            .then(L.bind(map.reset, map))
            .catch(err => {
                ui.addNotification(null, _('Failed to set active node: ') + err.message, 'error');
                console.log(`Error: ${err.message}`);
            })
            .finally(() => {
                widgets.Spinner.hide();
            });
    },

    render: function (data) {

        var m, s, o;

        m = new form.Map('freiheit', _(''), _(''))

        s = m.section(form.GridSection, 'node', _('Current Nodes'), _(''));
        s.addbtntitle = "Add New Node"
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;

        let self = this;

        s.renderRowActions = function (section_id) {
            const id = uci.get('freiheit', section_id, 'id');
            const activeNodeId = uci.get('freiheit', 'global', 'active_node_id');
            const tdEl = this.super('renderRowActions', section_id, _('Edit'));
            const setActiveNodeButton = E('button', {
                'class': 'cbi-button cbi-button-add',
                'click': self.setActiveNode.bind(self, m, id)
            }, "Set as Active Node");
            setActiveNodeButton.disabled = (id === activeNodeId);
            dom.append(tdEl.firstChild, setActiveNodeButton);
            if (id === '00000000') {
                tdEl.querySelectorAll('[title="Edit"]').forEach((btn) => btn.disabled = true);
                tdEl.querySelectorAll('[title="Delete"]').forEach((btn) => btn.disabled = true);
            }
            return tdEl;
        }

        s.renderContents = function (cfgsections, nodes) {
            const contents = this.super('renderContents', [cfgsections, nodes]);
            const activeNodeId = uci.get('freiheit', 'global', 'active_node_id');
            const activeNode = uci.sections('freiheit', 'node').find(node => node.id === activeNodeId);
            if (activeNode) {
                const name = activeNode['.name'];
                const activeTR = contents.querySelector(`tr[data-section-id="${name}"]`);
                activeTR?.classList.add('active-node');
            }
            return contents;
        }

        o = s.option(form.Value, 'remark', _('Remark'));
        o.rmempty = false;
        o.datatype = 'rangelength(3, 64)';
        o.modalonly = null;
        o.validate = function (section_id, value) {
            for (let section of uci.sections('freiheit', 'node')) {
                if (value === section.remark && section_id !== section['.name']) {
                    return _('This remark is already in use.');
                }
            }
            return true;
        };

        o = s.option(form.Value, 'protocol', _('Protocol'));
        o.modalonly = false;

        o = s.option(form.Value, 'server', _('Server'));
        o.modalonly = false;

        o = s.option(form.Value, 'subscription', _('Subscription'));
        o.modalonly = false;
        o.default = '-';

        o = s.option(form.ListValue, 'type', _('Type'));
        o.rmempty = false;
        o.modalonly = true;
        o.widget = 'radio';
        o.value('uri', _('URI'));
        o.value('file', _('Custom JSON'));
        o.default = 'uri'

        o = s.option(form.TextValue, 'uri', _('URI'));
        o.depends('type', 'uri');
        o.modalonly = true;
        o.rmempty = false;
        o.datatype = 'string';
        o.validate = utils.validateURL;

        o = s.option(form.FileUpload, 'file', _('Custom JSON File'), _(''));
        o.depends('type', 'file');
        o.rmempty = false;
        o.modalonly = true;
        o.root_directory = '/etc/freiheit/xray/uploads/';

        o = s.option(form.HiddenValue, 'id', _(''), _(''));
        o.modalonly = true;
        o.formvalue = function (section_id) {
            return this.super('formvalue', [section_id]) || utils.generateShortUUID();
        }

        s = m.section(widgets.VerticalSection);
        o = s.option(widgets.UpdateSubscriptionsButton);
        o = s.option(widgets.DeleteNodesButton);

        return m.render();

    }

});

