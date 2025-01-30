'use strict';
'require form';
'require uci';
'require view';
'require freiheit.utils as utils';
'require freiheit.widgets as widgets';

return view.extend({

    load: function () {
        utils.addCSS();
        return Promise.all([
            uci.load('freiheit'),
        ]);
    },

    render: function (data) {

        var m, s, o;

        m = new form.Map('freiheit', _(''), _(''))

        s = m.section(form.GridSection, 'subscription', _('Subscriptions'), _(''));
        s.addbtntitle = "Add New Subscription"
        s.addremove = true;
        s.anonymous = true;
        s.sortable = true;

        o = s.option(form.Value, 'name', _('Name'));
        o.rmempty = false;
        o.datatype = 'rangelength(3, 64)';
        o.validate = function (section_id, value) {
            for (let section of uci.sections('freiheit', 'subscription')) {
                if (value === section.name && section_id !== section['.name']) {
                    return _('This name is already in use.');
                }
            }
            return true;
        };

        o = s.option(form.Value, 'url', _('URL'));
        o.rmempty = false;
        o.datatype = 'string';
        o.validate = utils.validateURL;

        o = s.option(form.DummyValue, '', _('Number of Nodes'));
        o.modalonly = false;
        o.cfgvalue = function (section_id) {
            const subscription_name = uci.get('freiheit', section_id, 'name');
            const nodes = uci.sections('freiheit', 'node');
            return nodes.filter(node => node.subscription === subscription_name).length;
        };

        s = m.section(widgets.VerticalSection);
        o = s.option(widgets.UpdateSubscriptionsButton);

        return m.render();

    }

});
