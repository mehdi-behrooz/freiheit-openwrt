'use strict';
'require dom';
'require form';
'require uci';
'require ui';
'require view';
'require freiheit.utils as utils';
'require freiheit.widgets as widgets';
'require freiheit.rpcclient as rpcclient';
'require tools.widgets as luciwidgets';

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

        s = m.section(form.TableSection, 'route', _('Routing Rules'), _(''));
        s.anonymous = true;
        s.addremove = true;
        s.sortable = true;

        o = s.option(form.ListValue, 'type', _('Type'));
        o.value('ip', _('IP'));
        o.value('domain', _('Domain'));

        o = s.option(form.Value, 'content', _('Content'));

        o = s.option(form.ListValue, 'target', _('Target'));
        o.value('direct', _('Direct'));
        o.value('block', _('Block'));
        o.value('proxy', _('Proxy'));

        s = m.section(form.NamedSection, 'global', 'global', _('Default Routing'), _(''));

        o = s.option(form.ListValue, 'default_routing', _('Route unmatched packets to'));
        o.value('direct', _('Direct'));
        o.value('block', _('Block'));
        o.value('proxy', _('Proxy'));

        return m.render();

    }

});

