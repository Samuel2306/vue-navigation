/**
* vue-navigation v0.1.2
* https://github.com/zack24q/vue-navigation
* Released under the MIT License.
*/

var routes = [];

if (window.sessionStorage.VUE_NAVIGATION) {
  routes = JSON.parse(window.sessionStorage.VUE_NAVIGATION);
}

var Routes = routes;

var development = process.env.NODE_ENV === 'development';

var Navigator = function (store, moduleName) {
  if (store) {
    store.registerModule(moduleName, {
      state: {routes: Routes},
      mutations: {
        'navigation/FORWARD': function (state, name) {
          state.routes.push(name);
        },
        'navigation/BACK': function (state, count) {
          state.routes.splice(state.routes.length - count, count);
        },
        'navigation/REFRESH': function (state, count) {
        }
      }
    });
  }

  var forward = function (name) {
    store ? store.commit('navigation/FORWARD', name) : Routes.push(name);
    window.sessionStorage.VUE_NAVIGATION = JSON.stringify(Routes);
    development ? console.info('navigation: forward') : null;
  };
  var back = function (count) {
    store ? store.commit('navigation/BACK', count) : Routes.splice(Routes.length - count, count);
    window.sessionStorage.VUE_NAVIGATION = JSON.stringify(Routes);
    development ? console.info('navigation: back') : null;
  };
  var refresh = function () {
    store ? store.commit('navigation/REFRESH') : null;
    development ? console.info('navigation: refresh') : null;
  };

  var jumpTo = function (name) {
    var toIndex = Routes.lastIndexOf(name);
    if (toIndex === -1) {
      forward(name);
    } else if (toIndex === Routes.length - 1) {
      refresh();
    } else {
      back(Routes.length - 1 - toIndex);
    }
  };

  return {
    jumpTo: jumpTo
  }
};

var NavComponent = {
  name: 'navigation',
  props: {},
  data: function () {
    return {
      routes: Routes
    }
  },
  computed: {
    historyStr: function () {
      return this.routes.join(',')
    }
  },
  render: function (createElement) {
    return createElement(
      'keep-alive',
      {props: {include: this.historyStr}},
      this.$slots.default
    )
  },
};

var index = {
  install: function (Vue, options) {
    if (!options) {
      console.error('navigation need options');
      return
    }
    if (!options.router) {
      console.error('navigation need options.router');
      return
    }
    var router = options.router;
    var store = options.store;
    var moduleName = options.moduleName || 'navigation';

    var navigator = new Navigator(store, moduleName);

    // init page name
    router.beforeEach(function (to, from, next) {
      var matched = to.matched[to.matched.length - 1];
      if (matched) {
        var component = matched.components.default;
        component.name = component.name || 'anonymous-component-' + matched.path;
      }
      next();
    });

    // handle router change
    router.afterEach(function (to, from) {
      var matched = to.matched[to.matched.length - 1];
      if (matched) {
        var component = to.matched[to.matched.length - 1].components.default;
        navigator.jumpTo(component.name);
      }
    });

    Vue.component('navigation', NavComponent);

    Vue.navigation = Vue.prototype.$navigation = {
      getRoutes: function () {
        return Routes.slice()
      }
    };
  }
};

export default index;
