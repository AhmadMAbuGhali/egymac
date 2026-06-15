import CallFab from "./CallFab.jsx";
import WhatsAppFab from "./WhatsAppFab.jsx";

export default function ContactActionButtons() {
  return (
    <div className="contact-action-fabs">
      <WhatsAppFab />
      <CallFab />
    </div>
  );
}
