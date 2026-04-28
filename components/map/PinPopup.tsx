import type { RestaurantPin } from "@/app/api/restaurants/route";

export default function PinPopup({ pin, onClose }: { pin: RestaurantPin; onClose: () => void }) {
  void pin; void onClose;
  return null;
}
