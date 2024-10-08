import './assets/font.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import SideBar from './components/SideBar.vue'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas, far, fab)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component('SideBar', SideBar)
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')