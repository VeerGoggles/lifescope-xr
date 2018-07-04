import Vue from 'vue';
import VueRouter from 'vue-router';

import App from './App.vue';

// disable warn
//console.warn = function() {};

// must import aframe here to load components
import 'aframe';
import 'aframe-layout-component';
import 'networked-aframe';
import 'aframe-animation-component';
import 'aframe-src-fit-component';
import 'aframe-asset-on-demand-component';
import 'aframe-input-mapping-component';
import 'aframe-teleport-controls';
import 'aframe-extras';
import './components/aframe/play-gaze.js';
import './components/aframe/dynamic-autoplay.js';

// controls
import {mappings, inputActions} from './controls/input-mappings';
import { runInThisContext } from 'vm';
//console.log(mappings);
//console.log(inputActions);
AFRAME.registerInputActions(inputActions, 'default');
AFRAME.registerInputMappings(mappings);

// router
Vue.use(VueRouter);
var router = new VueRouter({
  mode: 'history',
  routes: []
});

// AFRAME.registerComponent('play-gaze', {
//   init: function () {

//     this.el.addEventListener('mouseenter', function (evt) {
//       var video = this.components.material.material.map.image;
//       if (!video) { return; }
//       video.play();
//       //this.play();
//       console.log('mouseenter: ', evt.detail);
//     });

//     this.el.addEventListener('mouseleave', function (evt) {
//       var video = this.components.material.material.map.image;
//       if (!video) { return; }
//       video.pause();
//       //this.pause();
//       console.log('mouseleave: ', evt.detail);
//     });
//   }
// });

//var app = new Vue(Vue.util.extend({ router }, App)).$mount('#app');
var app = new Vue({
    el: '#app',
    router: router,
    render: h => h(App)
  });
  