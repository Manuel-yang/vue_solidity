import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { toHandlers } from 'vue'
import contractABI from '../artifacts/contracts/WavePortal.sol/WavePortal.json'
const contractAddress = '0x54FCF7e2622E66562C74c2E12A1E4A102b867946'

export const useCryptoStore = defineStore('user', () => {
  const account = ref(null)
  const guestPosts = ref([] as any)
  const loading = ref(false)
  const guestPostsCount = ref(0)

  async function getBalance() {
    setLoader(true)
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer)
        const count = (await wavePortalContract.getBalance())
        const amt = ethers.utils.formatEther(count)
        console.log('count', amt)
        setLoader(false)
      }
    }
    catch (error) {
      setLoader(false)
      console.log('e', error)
    }
  }

  async function wave(messageInput) {
    console.log('setting loader')
    setLoader(true)
    try {
      console.log('got', messageInput)
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer)
        wavePortalContract.on('PrizeMoneySent', (receiver, amount) => {
          console.log('prize won! %s received', receiver, amount)
        })

        const overrides = {
          value: ethers.utils.parseEther('.05'),
          gasLimit: 200000,
        }
        const waveTxn = await wavePortalContract.wave(messageInput, overrides)
        console.log('Mining..', waveTxn.hash)
        await waveTxn.wait()
        console.log('Mined -- ', waveTxn.hash)
        const count = (await wavePortalContract.totalWaveCount())
        console.log('count', count)
        messageInput = ''
        setLoader(false)
      }
      else {
        console.log('Ethereum object doesn\'t exist')
      }
    }
    catch (error) {
      setLoader(false)
      console.log(error)
    }
  }

  async function getAllWaves() {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new toHandlers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer)

        const waves = await wavePortalContract.getAllWaves()

        const wavesCleaned = [] as any
        waves.forEach((wave) => {
          const waveTime = new Date(wavetimestamp * 1000)

          const waveTimeFormatted = new Intl.DateTimeFormat('en-US').format(waveTime) as any

          wavesCleaned.push({
            address: wave.waver,
            timestamp: waveTimeFormatted,
            message: wave.message,
          })
        })

        guestPosts.value = wavesCleaned
        wavePortalContract.on('NewWave', (from, message, timestamp) => {
          console.log('NewWave', from, timestamp, message)
          const waveTime = new Date(timestamp * 1000)

          const waveTimeFormatted = new Intl.DateTimeFormat('en-US').format(waveTime) as any

          guestPosts.value = [...guestPosts.value, {
            address: from,
            timestamp: waveTimeFormatted,
            message,
          }]
        })
      }
      else {
        console.log('Ethereum object doesn\'t exist')
      }
    }
    catch (error) {
      console.log(error)
    }
  }

  async function getWaveCount() {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new toHandlers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()

        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer)
        const count = (await wavePortalContract.totalWaveCount())
        console.log('Retrieved total wave count...', count)
        guestPostsCount.value = count
      }
      else {
        console.log('Ethereum obejct doesn\'t exists')
      }
    }
    catch (error) {
      console.log(error)
    }
  }

  async function connectWallet() {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert('Must connect to MetaMask!')
        return
      }
      const myAccounts = await ethereum.request({ method: 'eth_requestAccounts' })

      console.log('Coneected:', myAccounts[0])
      account.value = myAccounts[0]
      await getWaveCount()
      await getAllWaves()
      await getBalance()
    }
    catch (error) {
      console.log(error)
    }
  }

  function setLoader(value: boolean) {
    console.log('setLoader', value)
    loading.value = value
  }

  return {
    setLoader,
    loading,
    wave,
    connectWallet,
    account,
    guestPosts,
    guestPostsCount,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useCryptoStore, import.meta))
