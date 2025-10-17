import React from 'react'
import Hospital from '@mui/icons-material/LocalHospitalOutlined'

const gridItems = () => {
  return (
    <>
    <div className='grid grid-cols-4 gap-6' >
    <div className='col-span-1'>
        <div className='mx-auto bg-sky-50 rounded-x1'>
            <div className='flex justify-between'>
                <div className='m1-5 mt-5'>
                    <Hospital/>
                </div>
                <div className='m1-5 mt-5'>
                    <h2>
                        progress
                    </h2>
                </div>
            </div>
            <div className='p1-7 py-5'>
                <div className='text-blue-600 font-semibold'>
                    total Contracts
                </div>
                345
            </div>

            <div className='p1-7 py-5'>
                <div className='text-blue-600 font-semibold'>
                    total Usrs
                </div>
                123
            </div>
        </div>
    </div>
</div>
</>
  )
}

export default gridItems
