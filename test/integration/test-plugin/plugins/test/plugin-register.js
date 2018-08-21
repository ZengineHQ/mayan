plugin.register('wgn', {
    route: '{replace-route}',
    title: 'test',
    icon: 'icon-chart-pie',
    interfaces: [
        {
            controller: 'wgnMainCtrl',
            template: 'wgn-main',
            type: 'fullPage',
            order: 300,
            topNav: true,
            routes: [
                '/:page'
            ]
        }
    ]
});
