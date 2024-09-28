import React from 'react'

const stats = [ 
  {count : "5k" , label:"Active Students"},
  {count : "10+", label:"Mentors"} ,
  {count : "200+", label:"Courses"},
  {count : "50+", label:"Awards"},
]
 
const StatsComponent = () => {
  return (
   <section>
    <div >
      <div className='flex gap-2'>
        {
          stats.map((data,index)=>{

            return (
             
             <div key={index} className='flex gap-2'>
               <h1>
                 {data.count}
               </h1>
               <h2>
                {data.label }
               </h2>
             </div>
        
            )
          })
        }
      </div>
    </div>
   </section>
  )
}

export default StatsComponent