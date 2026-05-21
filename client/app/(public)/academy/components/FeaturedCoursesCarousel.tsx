"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import CourseCard from "./CourseCard";
import type { Course } from "@/types/course";

interface Props {
  courses: Course[];
}

export default function FeaturedCoursesCarousel({ courses }: Props) {
  const featured = courses.filter((c) => c.isFeatured);
  if (featured.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={24}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} transition-all duration-500"></span>`,
        }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="w-full h-full"
      >
        {featured.map((course) => (
          <SwiperSlide key={course.id} className="w-full h-full pb-16">
            <CourseCard course={course} variant="featured" />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
