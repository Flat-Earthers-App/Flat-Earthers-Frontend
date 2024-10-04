import * as turf from "@turf/turf";
import { useState , useEffect , createContext, useContext, useCallback } from "react";
import Cookies from "js-cookie";

//  I divided the functionalities into three hooks
//  Because I was noticing unwanted reloads which 
//  was caused due to the fact that all states where
//  stored in one function and exporting the function
//  was duplicating the states which made a huge mess


//  I might merge useTargets and useTargetsAPI toghater later

const useWRS2 = () => {

    const [ wrs2 , setWRS2 ] = useState([])

    useEffect( () => {

        fetch("/WRS2.json")
            .then( response => response.json() )
            .then( db => setWRS2(db.features) )
            .catch( err => console.log(err) )

    }, [])

    const extractSquares = useCallback(( lat , lng) => {
        const point = turf.point([lng, lat]);
    
        return wrs2.filter( feature => turf.booleanPointInPolygon(point,feature) )
            .map( feature => (
                {
                    path : feature.properties.PATH ,
                    row : feature.properties.ROW , 
                    coordinates : feature.geometry.coordinates[0].map(e => (
                        { lat : e[1] , lng : e[0] }
                    ))
                }
            ))
        }, [wrs2])
    
    return extractSquares

}

//  The targets are shared Between Google Map API and our 
//  SelectTarget Componet. In order to share this state
//  Between To Components useContext was used. IDK easier
//  way in react :(

const targetsContext = createContext()

const useTarget = () => {

    const TargetsProvider = useCallback( ({ children }) => {

        //  Initial Load for targets after refresh
        const [ targets , setTargets ] = useState(() => {
            const savedTargets = Cookies.get('targets')
            return savedTargets ? JSON.parse(savedTargets) : []
        })

        //  Instead of passing setTargets for changing targets we only
        //  pass addTarget to insure nothing is removed accidentally and
        //  the target cooky has the same data as our state
        const addTarget = ( target ) => {

            //  Store Targets in both cookies and state
            setTargets((prev) => {
                const newTargets = [...prev, target];
                Cookies.set('targets', JSON.stringify(newTargets), { expires: 7 }); // Store in cookies with 7-day expiration
                return newTargets;
            })
        }
        const deleteTarget = (index) => {
            //delete function
        }

        const downloadTarget = () => {

            //Download performs the downloading of the csv
            if(targets.length === 0){
                alert('Add Target points to Download data')
                return;
            }

            //setting up the data for headers and row data
            const header = ['Latitude', 'Longitude','Path', 'Row', 'Prediction']
            const rows = targets.map(entry =>[
                entry.lat,
                entry.lng,
                entry.path,
                entry.row,
                entry.prediction
            ])

            //mapping the rows to the headers
            const csv= [
                header.join(','),
                ...rows.map(e => e.join(','))
            ].join('\n')

            //create a binary large object? with the data and type(csv)
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;' })
            //creating link and url for the blob and download
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            //link setup for download
            link.setAttribute('href', url)
            link.setAttribute('download', 'data.csv')
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

        }

        return (
            <targetsContext.Provider value={{ targets , addTarget, deleteTarget , downloadTarget }}>
                {children}
            </targetsContext.Provider>
        )

    }, [targetsContext] )

    const targetsState = useCallback( () => useContext(targetsContext) , [targetsContext])
    

    return {  TargetsProvider , targetsState }

}

const useTargetsAPI = () => {

    //API Calling the sync the data
    const pushTargets = useCallback((targets) => {
        console.log("pushing targets to server...")
        console.log(targets)
    }, [])

    const pullTargets = useCallback(() => {
        console.log("pulling targets from server...")
        return ["Stored Targets !!!"]
    }, [])

    return { pushTargets , pullTargets }
}


export { useTarget , useWRS2 , useTargetsAPI };