import keyring from '@polkadot/ui-keyring';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise, WsProvider } from '@polkadot/api'
import types from './types.json'
import localStorage from '@/lib/local-storage'
// u8aToString, stringToU8a
import { u8aToHex } from '@polkadot/util'
import { queryLabsById } from '@/lib/polkadotProvider/query/labs'

const {
  // mnemonicToMiniSecret,
  // naclKeypairFromSeed,
  cryptoWaitReady,
} = require('@polkadot/util-crypto');

cryptoWaitReady().then(() => {
  keyring.loadAll({ ss58Format: 42, type: 'ed25519' });
});

const defaultState = {
  api: null,
  isLoadingApi: false,
  isLoadingWallet: false,
  wallet: null,
  walletBalance: null,
  labAccount: null,
  isLabAccountExist: false,
}

export default {
  namespaced: true,
  state: {
    ...defaultState
  },
  mutations: {
    SET_API(state, api) {
      state.api = api
    },
    SET_LOADING_API(state, isLoading) {
      state.isLoadingApi = isLoading
    },
    SET_WALLET(state, wallet) {
      state.wallet = wallet
    },
    SET_LAB_ACCOUNT(state, labAccount) {
      state.labAccount = labAccount
      state.isLabAccountExist = true
    },
    SET_IS_LAB_ACCOUNT_EXIST(state, isLabAccountExist) {
      state.isLabAccountExist = isLabAccountExist
    },
    SET_LOADING_WALLET(state, isLoadingWallet) {
      state.isLoadingWallet = isLoadingWallet
    },
    SET_WALLET_BALANCE(state, balance) {
      state.walletBalance = balance
    },
    CLEAR_WALLET(state) {
      state.wallet = null
      state.walletBalance = null
    }
  },
  actions: {
    async connect({ commit }) {
      try {
        commit('SET_LOADING_API', true)
        const PROVIDER_SOCKET = 'wss://debio.theapps.dev/node'
        const wsProvider = new WsProvider(PROVIDER_SOCKET)
        const api = await ApiPromise.create({
          provider: wsProvider,
          types: types
        })

        // Example of how to subscribe to events via storage
        api.query.system.events((events) => {
          console.log(`\nReceived ${events.length} events:`)

          events.forEach((record) => {
            const { event, phase } = record

            // Show what we are busy with
            if(event.section === 'orders' && event.method === 'OrderPaid'){
              console.log(`Received an OrderPaid event`)
              console.log(`Phase: ${phase.toString()}`)
            }
          })
        })

        await api.isReady
        commit('SET_API', api)

        commit('SET_LOADING_API', false)
      } catch (err) {
        console.log(err)
        commit('SET_LOADING_API', false)
      }
    },
    async registerMnemonic({ commit }, { mnemonic, password }) {
      try {
        commit('SET_LOADING_WALLET', true)
        commit('CLEAR_WALLET')

        const { pair, json } = keyring.addUri(mnemonic, password, { name: 'mnemonic acc' })
        pair.unlock(password)
        localStorage.setKeystore(JSON.stringify(json))
        localStorage.setAddress(pair.address)
        commit('SET_WALLET_PUBLIC_KEY', u8aToHex(pair.publicKey))
        console.log('Is pair locked?', pair.isLocked)
        commit('SET_WALLET', pair) // FIXME: simpen untuk dev
        commit('SET_LOADING_WALLET', false)

        // const seed = mnemonicToMiniSecret(mnemonic)
        // const { publicKey, secretKey } = naclKeypairFromSeed(seed)
        // console.log(u8aToHex(publicKey))
        // console.log(u8aToHex(secretKey))

        return { success: true }
      } catch (err) {
        console.log(err)
        commit('CLEAR_WALLET')
        commit('SET_LOADING_WALLET', false)
        return { success: false, error: err.message }
      }
    },
    async restoreAccountKeystore({ commit }, { file, password }) {
      try {
        commit('SET_LOADING_WALLET', true)
        const pair = keyring.restoreAccount(file, password);
        pair.unlock(password)
        localStorage.setKeystore(JSON.stringify(file))
        localStorage.setAddress(pair.address)
        commit('SET_WALLET_PUBLIC_KEY', u8aToHex(pair.publicKey))
        console.log('Is pair locked?', pair.isLocked)
        commit('SET_WALLET', pair) // FIXME: simpen untuk dev
        commit('SET_LOADING_WALLET', false)

        return { success: true }
      } catch (err) {
        commit('CLEAR_WALLET')
        commit('SET_LOADING_WALLET', false)
        return { success: false, error: err.message }
      }
    },
    async getAkun({ commit,state }, { address }) {
      try {
        commit('SET_LOADING_WALLET', true)
        const pair = keyring.getPair(address);
        commit('SET_WALLET_PUBLIC_KEY', u8aToHex(pair.publicKey))
        commit('SET_WALLET', pair) // FIXME: simpen untuk dev
        commit('SET_LOADING_WALLET', false)

        commit('SET_LAB_ACCOUNT', null)
        commit('SET_IS_LAB_ACCOUNT_EXIST', false)
        const labAccount = await queryLabsById(state.api, address)
        console.log(labAccount)
        if(labAccount){
          commit('SET_LAB_ACCOUNT', labAccount)
          commit('SET_IS_LAB_ACCOUNT_EXIST', true)
        }

        return { success: true }
      } catch (err) {
        console.log(err)
        commit('CLEAR_WALLET')
        commit('SET_LOADING_WALLET', false)
        return { success: false, error: err.message }
      }
    },
    async checkMnemonicSomeAddress({ commit },{ mnemonic, accountAddress }) {
      try {
        const keyringX = new Keyring({ type: 'ed25519', ss58Format: 42 });
        const pair = keyringX.addFromUri(mnemonic, { name: 'first pair' }, 'ed25519');
        commit('SET_LOADING_WALLET', false)
        if (accountAddress == pair.address) {
          console.log(accountAddress);
          console.log(pair.address);
          return { success: true }
        } else {
          return { success: false }
        }
        
      } catch (err) {
        return { success: false }
      }
    },
  },
  getters: {
    wallet(state) {
      return state.wallet
    },
    labAccount(state) {
      return state.labAccount
    },
    isLabAccountExist(state) {
      return state.isLabAccountExist
    },
    getAPI(state) {
      return state.api
    }
  }
}

