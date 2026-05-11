import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <>
            <h1 className='text-3xl text-center my-10 text-red-500'>Welcome to Chintamani Cricket Association</h1>
            <div className='flex gap-5 my-10 items-center justify-center'>
                <Link to="/noraml"><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2'>Normal</button></Link>
                <Link to="/DatatableExample"><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2'>Data Table</button></Link>
                <Link to="/updateTable"><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2'>Update Table</button></Link>
                <Link to="/transactions"><button className='bg-blue-500 p-2 text-xl m-auto text-white rounded mb-2'>See All Transactions</button></Link>
            </div>
        </>
    )
}

export default Home
