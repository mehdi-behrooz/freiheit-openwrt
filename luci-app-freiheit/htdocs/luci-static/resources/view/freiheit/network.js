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

        s = m.section(form.NamedSection, 'network', 'network', _('Network'), "Packets that meet any of these conditions will be routed to Xray.");
        s.anonymous = true;

        o = s.option(luciwidgets.DeviceSelect, 'interfaces', _('Interfaces'));
        o.multiple = true;
        o.noaliases = true;
        o.noinactive = true;

        o = s.option(form.DynamicList, 'sourceips', _('Source IP'));
        o.datatype = 'cidr4';

        return m.render();

    }

});

