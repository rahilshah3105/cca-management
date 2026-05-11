import { useEffect, useState } from 'react'
import '../App.css'
import { Link } from 'react-router-dom';

const Noraml = () => {

  const [name, setname] = useState([]);

  useEffect(() => {
    fetch('data.json')
      .then(res => res.json())
      .then(data => setname(data.players))
  })

  return (
    <>
      <h1 className='text-red-500'>Shree C.C.A Records</h1>
      <table className='table text-xl'>
        <tbody>
          <tr className='flex justify-around'>
            {/* <th>Id</th> */}
            <th>Name</th>
            <th>Total Paid Rs.</th>
          </tr>
          {
            name.map((player) => {
              return (
                <tr key={player.id}>
                  {/* <td>{player.id}</td> */}
                  <td>{player.name}</td>
                  <td>{player.Rs}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
      <Link to={"/"}><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2 flex mt-10'>Home</button></Link>
    </>
  )
}

export default Noraml