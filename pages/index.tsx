import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { directoryOpen, fileSave, supported } from 'browser-fs-access'
import dynamic from 'next/dynamic'

const Home = dynamic(() => import('../components/Home.jsx'), {
  ssr: false,
})

function App() {
  return <Home />
}

export default App
