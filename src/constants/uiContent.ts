import { Activity, Dumbbell, ScanLine } from 'lucide-react';

export const MEASUREMENT_TOOLTIPS = {
  waist: {
    title: "How to Measure Your Waist",
    description: "Find the narrowest part of your torso, usually just above your belly button. Stand straight, breathe normally, and do not suck your stomach in. Keep the tape parallel to the floor.",
  },
  chest: {
    title: "How to Measure Your Chest",
    description: "Wrap the tape under your armpits and around the fullest part of your chest. Stand normally with your arms relaxed at your sides and exhale naturally before reading the number.",
  },
  bicep: {
    title: "How to Measure Your Bicep",
    description: "Raise your arm to the side and flex your bicep at a 90-degree angle. Wrap the tape around the absolute thickest peak of the muscle. Ensure you measure exactly this way every time for accurate tracking.",
  },
  bodyFat: {
    title: "Body Fat Percentage",
    description: "Enter the body fat percentage from your smart scale or skinfold calipers. Don't have those? Click 'Calculate for me' below to estimate it using the US Navy Method.",
  },
  neck: {
    title: "Neck Measurement (Navy Method)",
    description: "Look straight ahead and relax your shoulders. Wrap the tape around your neck, just below your Adam's apple (larynx). The tape should rest flat against the skin, not too tight.",
  },
  hips: {
    title: "Hip Measurement (Navy Method)",
    description: "Stand with your feet together. Wrap the tape around the absolute widest part of your hips and glutes (buttocks). Keep the tape parallel to the floor.",
  }
};

export const ONBOARDING_SLIDES = [
  {
    id: "slide-1",
    title: "Welcome to PlanR",
    subtitle: "Meet your new Smart Coach. PlanR isn't just a digital notepad—it's an intelligent engine that adapts to your body, your goals, and your daily recovery.",
    icon: Activity, 
    primaryColor: "text-blue-500",
  },
  {
    id: "slide-2",
    title: "Workouts That Evolve",
    subtitle: "Whether you're cutting fat or building muscle, PlanR dynamically adjusts your sets, reps, and rest times based on your performance and fatigue levels.",
    icon: Dumbbell,
    primaryColor: "text-orange-500",
  },
  {
    id: "slide-3",
    title: "Intelligent Nutrition",
    subtitle: "Instantly log food using our blazing-fast barcode scanner. PlanR syncs your daily macros directly to your training engine to ensure you are always perfectly fueled.",
    icon: ScanLine,
    primaryColor: "text-teal-400",
  }
];
