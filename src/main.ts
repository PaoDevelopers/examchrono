import { mount } from "svelte"
import App from "./App.svelte"
import "./app.css"
import { store } from "./lib/store.svelte"

// Prevent accidental refreshes and closes.
// We don't store anything in local storage, cookies, etc.
window.addEventListener("beforeunload", (e) => {
	if (store.timers.length === 0) return
	e.preventDefault()
})

const target = document.getElementById("app")
if (target === null) throw new Error("missing #app in index.html")
const app = mount(App, { target })

export default app
