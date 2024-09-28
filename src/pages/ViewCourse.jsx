import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet, useParams } from "react-router-dom"

import CourseReviewModal from "../components/core/ViewCourse/CourseReviewModal"
import VideoDetailsSidebar from "../components/core/ViewCourse/VideoDetailsSlidebar"
import { getFullDetailsOfCourse } from "../services/operations/courseDetailsApi"
import {
  setCompletedLectures,
  setCourseSectionData,
  setEntireCourseData,
  setTotalNoOfLectures,
} from "../slices/viewCourseSlice"

 function ViewCourse() {
  const { courseId } = useParams()
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [reviewModal, setReviewModal] = useState(false)

//   useEffect(() => {
//     ;(async () => {
//       const courseData = await getFullDetailsOfCourse(courseId, token)
//       // console.log("Course Data here... ", courseData.courseDetails)
//       dispatch(setCourseSectionData(courseData.courseDetails.courseContent))
//       dispatch(setEntireCourseData(courseData.courseDetails))
     
//       dispatch(setCompletedLectures(courseData.completedVideos))
      
//       //count the total lectures 
//       let lectures = 0
//       courseData?.courseDetails?.courseContent?.forEach((sec) => {
//         lectures += sec.subSection.length
//       })
//       dispatch(setTotalNoOfLectures(lectures))
//     })()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseData = await getFullDetailsOfCourse(courseId, token);
        dispatch(setCourseSectionData(courseData.courseDetails.courseContent));
        dispatch(setEntireCourseData(courseData.courseDetails));
        dispatch(setCompletedLectures(courseData.completedVideos));

        let lectures = 0;
        courseData?.courseDetails?.courseContent?.forEach((sec) => {
          lectures += sec.subSection.length;
        });
        dispatch(setTotalNoOfLectures(lectures));
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [courseId, token, dispatch]);

  return (
    <>

      <div className="relative flex min-h-[calc(100vh-3.5rem)]">
      {/* sidebar */}
        <VideoDetailsSidebar setReviewModal={setReviewModal} />
        <div className="h-[calc(100vh-3.5rem)] flex-1 overflow-auto">
         {/* outlet for video */}
          <div className="mx-6">
            <Outlet />
          </div>
        </div>
      </div>
      {reviewModal && <CourseReviewModal setReviewModal={setReviewModal} />}
    </>
  )
}


export default ViewCourse