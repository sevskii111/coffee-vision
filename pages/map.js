import Layout from '../components/layout'
import dynamic from 'next/dynamic'
import cameras from '../cameras';

const Map = () => {
  const Map = dynamic(
    () => import('../components/map'), 
    { ssr: false }
  )
  return <Layout><Map cameras={cameras}/></Layout>
}

export default Map
