import { PresetEnvironment } from '../types';

// Import local generated images as assets
import livingRoomImg from '../assets/images/living_room_preset_1782905529099.jpg';
import kitchenImg from '../assets/images/kitchen_counter_preset_1782905541588.jpg';
import sidewalkImg from '../assets/images/sidewalk_obstacles_1782905555383.jpg';
import medicineImg from '../assets/images/medicine_label_preset_1782905567430.jpg';
import cafeImg from '../assets/images/cafe_menu_preset_1782905583407.jpg';

export const PRESET_ENVIRONMENTS: PresetEnvironment[] = [
  {
    id: 'living_room',
    name: 'Cozy Living Room',
    category: 'Indoor Layout',
    imageUrl: livingRoomImg,
    description: 'A cozy living room featuring a soft blue couch, a wooden coffee table in front of it holding a plastic water bottle and a tea mug, and a tall green houseplant in the left corner.',
    hotspots: [
      { label: 'Blue Sofa Couch', x: 50, y: 45, distance: '5 feet directly ahead' },
      { label: 'Wooden Coffee Table', x: 50, y: 72, distance: '3 feet directly ahead' },
      { label: 'Plastic Water Bottle', x: 56, y: 64, distance: '3 feet ahead, slightly to the right' },
      { label: 'Ceramic Tea Mug', x: 44, y: 66, distance: '3 feet ahead, slightly to the left' },
      { label: 'Tall Green Houseplant', x: 12, y: 40, distance: '7 feet to the far left' },
    ]
  },
  {
    id: 'kitchen_counter',
    name: 'Kitchen Counter & Medicines',
    category: 'Indoor Utility',
    imageUrl: kitchenImg,
    description: 'A clean, bright kitchen workspace with a plastic water bottle, an amber-colored medical prescription bottle with a white lid, a loaf of sliced bread, and a ceramic fruit bowl in the background.',
    hotspots: [
      { label: 'Amber Medication Bottle', x: 42, y: 55, distance: '1.5 feet away on the counter' },
      { label: 'Clear Plastic Water Bottle', x: 30, y: 45, distance: '2 feet away on the left' },
      { label: 'Loaf of Sliced Bread', x: 62, y: 58, distance: '1.5 feet away on the right' },
      { label: 'Ceramic Fruit Bowl', x: 80, y: 50, distance: '3 feet away on the far right' },
    ]
  },
  {
    id: 'sidewalk_crossing',
    name: 'City Sidewalk & Crosswalk',
    category: 'Outdoor Navigation',
    imageUrl: sidewalkImg,
    description: 'An outdoor concrete city sidewalk. A bright yellow-orange safety cone stands on the right, a bicycle is parked against a red brick wall on the left, and a white pedestrian crosswalk lines the street ahead.',
    hotspots: [
      { label: 'Yellow-Orange Safety Cone (Obstacle)', x: 74, y: 75, distance: '4 feet ahead, slightly to the right' },
      { label: 'Parked Bicycle', x: 22, y: 55, distance: '6 feet ahead on the left pathway' },
      { label: 'Red Brick Storefront Wall', x: 10, y: 40, distance: '5 feet to the far left' },
      { label: 'Pedestrian Crosswalk Lines', x: 50, y: 35, distance: '12 feet straight ahead' },
    ]
  },
  {
    id: 'medicine_label',
    name: 'Prescription Bottle Zoom',
    category: 'Reading OCR',
    imageUrl: medicineImg,
    description: 'A detailed close-up shot of two amber prescription bottles on a clean white surface. The printed labels are clear, visible, and contain readable medication instructions and patient details.',
    hotspots: [
      { label: 'Prescription Bottle Label #1', x: 38, y: 50, distance: '1 foot away, clear reading focus' },
      { label: 'Medication Instructions ("Take 1 tablet daily")', x: 40, y: 62, distance: '1 foot away, clear focus' },
      { label: 'Prescription Bottle Label #2', x: 65, y: 50, distance: '1 foot away, slightly behind' },
    ]
  },
  {
    id: 'cafe_table',
    name: 'Cafe Dining Table',
    category: 'Reading & Shopping',
    imageUrl: cafeImg,
    description: 'A close-up view of a rustic wooden cafe table. A paper dining menu is resting on the table next to a hot steaming cup of black coffee in a grey ceramic mug.',
    hotspots: [
      { label: 'Paper Food & Drinks Menu', x: 42, y: 60, distance: '1.5 feet away on the table' },
      { label: 'Steaming Cup of Black Coffee', x: 76, y: 52, distance: '1.5 feet away on the right' },
      { label: 'Cafe Menu Prices ("Espresso $3.50")', x: 38, y: 54, distance: '1.5 feet away, legible text' },
    ]
  }
];
