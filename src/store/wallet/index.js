import axios from "axios";

const defaultState = {
  ethAddress: null,
}

export default {
  namespaced: true,
  state: { ...defaultState },
  mutations: {
    SET_RESULT(state, ethAddress) {
      state.ethAddress = ethAddress
    },
  },
  actions: {
    async walletBinding({commit}, data) {
      
      const debioApiKey = process.env.VUE_APP_DEBIO_API_KEY
      const baseUrl = process.env.VUE_APP_DEV_DEGENICS_BACKEND_URL
      const result = await axios.post(`${baseUrl}/substrate/wallet-binding`, data , {
      headers: {
        "debio-api-key" : debioApiKey
      }})
      commit('SET_RESULT', result.data)
    }
  },
}