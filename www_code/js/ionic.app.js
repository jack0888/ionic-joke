//路由配置
'use strict';

var app = angular.module('jokeApp', ['ionic', 'ngCordova'])
//全局配置
.config(['$ionicConfigProvider', function($ionicConfigProvider) {
	$ionicConfigProvider.views.swipeBackEnabled(false);
	$ionicConfigProvider.platform.android.scrolling.jsScrolling(true);

	$ionicConfigProvider.platform.ios.tabs.style('standard');
	$ionicConfigProvider.platform.ios.tabs.position('bottom');
	$ionicConfigProvider.platform.android.tabs.style('standard');
	$ionicConfigProvider.platform.android.tabs.position('standard');

	$ionicConfigProvider.platform.ios.navBar.alignTitle('center');
	$ionicConfigProvider.platform.android.navBar.alignTitle('center');

	$ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-left');
	$ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-ios-arrow-left');

	$ionicConfigProvider.platform.ios.views.transition('ios');
	$ionicConfigProvider.platform.android.views.transition('ios');
	$ionicConfigProvider.views.transition('none'); //禁止动画
	$ionicConfigProvider.spinner.icon('ios'); //android
}])
//全局错误处理
.factory('$exceptionHandler', ['$injector', 'config', function($injector, config) {
	return function(exception, cause) {
		var formatted = '';
		var properties = '';
		formatted += 'Exception: "' + exception.toString() + '"\n';
		formatted += 'Caused: ' + cause + '\n';

		properties += (exception.message) ? 'Message: ' + exception.message + '\n' : ''
		properties += (exception.fileName) ? 'File Name: ' + exception.fileName + '\n' : ''
		properties += (exception.lineNumber) ? 'Line Number: ' + exception.lineNumber + '\n' : ''
		properties += (exception.stack) ? 'Stack Trace: ' + exception.stack + '\n' : ''

		if (properties) formatted += properties;

		var $location = $injector.get('$location');
		formatted = 'Url: ' + $location.path() + '\n' + formatted;
		console.log(formatted);

		if (!config.errors) config.errors = [];
		if (config.errors.indexOf(formatted) != -1) return false;

		var UserService = $injector.get('UserService');
		UserService.feedback(formatted).then(function(res) { });
		config.errors.push(formatted);
	};
}])
//路由配置
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
	$stateProvider
	.state('tabs', { url: '/tabs', abstract: true, templateUrl: 'tabs.html', controller: 'tabsController' })

	.state('tabs.joke', { url: '/joke', views: { joke: { templateUrl: 'joke.html', controller: 'jokeController' }}})
	.state('search', { url: '/search', templateUrl: 'search.html', controller: 'searchController' })

	.state('tabs.meitu', { url: '/meitu', views: { meitu: { templateUrl: 'meitu.html', controller: 'meituController' }}})

	.state('tabs.like', { url: '/like', views: { like: { templateUrl: 'like.html', controller: 'likeController' }}})

	.state('tabs.setting', { url: '/setting', views: { setting: { templateUrl: 'setting.html', controller: 'settingController' }}})
	.state('upload', { url: '/upload', templateUrl: 'upload.html', controller: 'uploadController' })
	.state('feedback', { url: '/feedback', templateUrl: 'feedback.html', controller: 'feedbackController' })
	.state('about', { url: '/about', templateUrl: 'about.html', controller: 'aboutController' })
	.state('audit', { url: '/audit', templateUrl: 'audit.html', controller: 'auditController' })
	.state('version', { url: '/version', templateUrl: 'version.html', controller: 'versionController' });
}])
//启动
.run(['$ionicPlatform', '$rootScope', '$location', '$ionicHistory', '$timeout', 'init', 'msg', 'data', 'util', 'login', 'config', function($ionicPlatform, $rootScope, $location, $ionicHistory, $timeout, init, msg, data, util, login, config) {
	$rootScope.fontSize = data.get('fontSize') || '16';
	$rootScope.openNight = data.get('openNight') == 'true' ? true : false;
	$rootScope.skin = $rootScope.openNight ? 'dark' : (data.get('skin') || 'assertive');
	$rootScope.fontSizes = config.fontSizes;

	//禁用系统的虚拟返回键
	$ionicPlatform.registerBackButtonAction(function (e) {
		if ($location.path().indexOf('tabs/') != -1) {
			if ($rootScope.backButtonPressedOnceToExit) {
				ionic.Platform.exitApp();
				$rootScope.$destroy();
			} else {
				$rootScope.backButtonPressedOnceToExit = true;
				msg.text('再按一次退出系统', 0.9);
				$timeout(function () { $rootScope.backButtonPressedOnceToExit = false; }, 3000);
			}
		} else if ($ionicHistory.backView()) {
			$ionicHistory.goBack();
		}
		e.preventDefault();
		e.stopPropagation();
		return false;
	}, 101);
	//$ionicPlatform.on('resume', function(e) { }); //激活
	//$ionicPlatform.on('pause', function(e) { }); //暂停
	//$ionicPlatform.on('online', function(e) { }); //联网

	$ionicPlatform.ready(function() {
		login.init();
		if (navigator.connection && navigator.connection.type == 'none') {
			if (navigator.splashscreen) navigator.splashscreen.hide();
			return msg.text('请连接网络！');
		}
		if(window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);
		}
		if(window.StatusBar) StatusBar.styleLightContent();
		//if(window.StatusBar && $rootScope.skin == 'assertive')
		//	StatusBar.styleLightContent();
		//else if(window.StatusBar && $rootScope.skin == 'dark')
		//	StatusBar.styleDefault();
		init.auth().then(function(u) {
			$rootScope.uid = u.uid;
			$rootScope.admin = u.admin;
			$rootScope.maxJoke = 0;
			if (navigator.splashscreen) $timeout(function(){ navigator.splashscreen.hide(); }, 1000);
			if (u && u.update==1 && navigator.connection) { $location.path('/version'); return false; }
			init.setJPushTagsAndAlias();
			$location.path('/tabs/joke');
		});
	});
}]);
