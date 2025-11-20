export interface DepositDataProps {
    depositAmount: number;
    depositHoldTime: number;
    depositRemindTime: number;
    paypalEnabled: boolean;
    paypalMethod: string;
    etransferEnabled: boolean;
    etransferMethod: string;
    creditcardEnabled: boolean;
    creditcardMethod: string;
    venmoEnabled: boolean;
    venmoMethod: string;
}

export const timesChunks = [
    [{ value: '12', label: '12 Hours' }, { value: '24', label: '24 Hours' }],
    [{ value: '48', label: '48 Hours' }, { value: '72', label: '72 Hours' }],
]

export interface PolicyDataProps {
    cancellationPolicy: string;
    reschedulePolicy: string;
    depositPolicy: string;
    questionOne: string;
    questionTwo: string;
    waiverText: string;
    privacyPolicy: string;
    termsOfCondition: string;
}

export interface TemplateDataProps {
    newBookingRequestReceivedSubject: string;
    newBookingRequestReceivedBody: string;
    bookingRequestApprovedAutoSubject: string;
    bookingRequestApprovedAutoBody: string;
    bookingRequestApprovedManualSubject: string;
    bookingRequestApprovedManualBody: string;
    declinedBookingRequestSubject: string;
    declinedBookingRequestBody: string;
    depositPaymentReminderSubject: string;
    depositPaymentReminderBody: string;
    depositForfeitSubject: string;
    depositForfeitBody: string;
    depositKeepSubject: string;
    depositKeepBody: string;
    consultConfirmationSubject: string;
    consultConfirmationBody: string;
    consultReminderSubject: string;
    consultReminderBody: string;
    consultDeclinedSubject: string;
    consultDeclinedBody: string;
    appointmentConfirmationNoProfileSubject: string;
    appointmentConfirmationNoProfileBody: string;
    appointmentConfirmationWithProfileSubject: string;
    appointmentConfirmationWithProfileBody: string;
    appointmentFinalConfirmationSubject: string;
    appointmentFinalConfirmationBody: string;
    waiverReminderSubject: string;
    waiverReminderBody: string;
    healingCheckInSubject: string;
    healingCheckInBody: string;
    cancellationNotificationSubject: string;
    cancellationNotificationBody: string;
}

export const defaultTemplateData: TemplateDataProps = {
    newBookingRequestReceivedSubject: "Booking Request Received",
    newBookingRequestReceivedBody: "Thanks for sending your idea my way! I'll look it over and get back to you soon. While you wait, feel free to check out more of my work.",
    bookingRequestApprovedAutoSubject: "You're approved — here's your quote and booking link",
    bookingRequestApprovedAutoBody: "Hi [Client First Name],\nYour tattoo request has been approved.\nHere's your full project quote:\nProject Title: [auto-fill].\nLocation: [auto-fill]\nNumber of Sessions: [auto-fill].\nSession Rate: [auto-fill]\nDeposit Required: [auto-fill]\nProject Notes: [auto-fill]\nBook Your Dates Here:\n[Insert auto-generated client calendar link]\nSelect the dates that work best for you, submit your deposit, and your appointment will be confirmed automatically.\nYour calendar to choose from has been set based on my availability, timing preferences, and your project details.\nDeposit policy [auto-fil]\nCancellation policy [auto-fill]\nThanks so much - I'm looking forward to working with you.\n[Your Name]\n[Studio Name]",
    bookingRequestApprovedManualSubject: "You're approved - here's your quote and appointment details",
    bookingRequestApprovedManualBody: "Hi [Client First Name],\n\nYour tattoo request has been approved and your appointment has been scheduled. Here are the full details:\n\nProject Title: [auto-fill-title]\nLocation: [auto-fill-location]\nSession Date(s): [auto-fill-date]\nSession Rate: [auto-fill-session-rate]\nStart Time: [auto-fill-start-time]\nSession Length: [auto-fill-session-length]\nProject Notes: [auto-fill-notes]\nDeposit Required: [auto-fill-deposit-required]\n\nPlease pay your deposit using the below links:\n\n(insert clickable payment links here)\nDeposit policy: [auto-fill-deposit-policy]\n\nCancellation policy: [auto-fill-cancellation-policy]\n\nThanks so much - I'm looking forward to working with you.\n\n[Your Name]\n[Studio Name]",
    declinedBookingRequestSubject: "Booking Request Update",
    declinedBookingRequestBody: "Hi [Client Name],\nThanks so much for your request.\nUnfortunately, I won't be able to take on your booking at this time due to [insert decline reason].\nI really appreciate your interest and wish you the best on your tattoo journey!\nWarmly,\n[Your Name]",
    depositPaymentReminderSubject: "Deposit still needed to confirm your date",
    depositPaymentReminderBody: "Hey! Just a quick nudge — your deposit hasn't come through yet.\nPlease pay by [deadline] to keep your spot.",
    depositForfeitSubject: "Let's Get You Rebooked",
    depositForfeitBody: "Hey [Client Name],\nI noticed you needed to reschedule or cancel your appointment.\nI've decided to forfeit your deposit (add reason from deposit forfeit.)\nNo stress — here's what happens next:\nTo rebook your session:\nClick the link below to choose a new appointment date:\n[Insert calendar link]\nPay your new deposit  (show payment method links)\nThat's it — your appointment will be confirmed automatically.\nDeposit Info:\n• Amount: [$X] (autogenerated from original quote)\n• Non-refundable\n• Required to secure your new date\n\nTalk soon,\n[Artist Name]",
    depositKeepSubject: "Deposit kept — your appointment is confirmed!",
    depositKeepBody: "Hey [Client first Name],\nI noticed you needed to reschedule your appointment. (add reason from keep deposit on file if applicable.) No stress — here's what happens next:\nTo rebook your session, just click the link below to choose a new appointment date:\n(insert clickable booking links here)\nThat's it — your appointment will be confirmed automatically.\nTalk soon,\n[Artist Name]",
    consultConfirmationSubject: "You've booked a consultation!",
    consultConfirmationBody: "Your consult is booked for [Date] at [Time]. Zoom link is below — or for in-person, come by: [Address].",
    consultReminderSubject: "You've booked a consultation!",
    consultReminderBody: "Your consultation is coming up soon — here's the [date], [time], and [link] if needed. See you then!",
    consultDeclinedSubject: "Booking Consult Update",
    consultDeclinedBody: "Hi [Client Name], Thanks so much for your request. Unfortunately, I won't be able to take on your booking at this time due to [insert decline reason]. I really appreciate your interest and wish you the best on your tattoo journey! Warmly, [Your Name]",
    appointmentConfirmationNoProfileSubject: "Your tattoo is confirmed & your client portal is ready",
    appointmentConfirmationNoProfileBody: "Hi [Client First Name],\n\nI'm so excited to be working with you. As a perk of being my client, you now get access to your exclusive Client Portal — powered by Simple Tattooer.\n\nYour tattoo is confirmed for:\n[Date, Time, location]\n\nYou'll receive your appointment confirmation and reminders by email. To manage your booking and message your artist\n\nDownload our app for free below — no passwords needed. Everything you need is always one click away.\n\n(Button- Start Here)\n\nInside your personal dashboard, you'll find your appointment details, payment info and receipts, my aftercare + FAQ pages, a reschedule/cancel button if anything changes, and a direct message portal to reach me anytime. \n\nThis is your private space — built just for you.\n\nCan't wait to see you soon,\n[Your Name]\n[Studio Name]",
    appointmentConfirmationWithProfileSubject: "You're In — Your New Appointment's Ready",
    appointmentConfirmationWithProfileBody: "Hi [Client First Name],\n\nYour new tattoo project is officially a go! You can view the full details your client dashboard in the “Your Dates” section!\n\nThanks again for trusting me with another piece — I can't wait to get started.\n\nSee you soon,\n[Your Name]\n[Studio Name, if applicable]",
    appointmentFinalConfirmationSubject: "Final Appointment Confirmation",
    appointmentFinalConfirmationBody: "Hi [Client First Name],\n\nYour tattoo appointment is waiting for confirmation.\nPlease confirm your session in your Simple Tattooer client portal below.\n\nIf you haven't downloaded the app yet, it only takes a minute — it’s where you’ll confirm your booking, sign your waiver, and view any drawings if applicable.\n\n[Open My Portal]\n\nOnce confirmed, your appointment details will update automatically.\n\nSee you soon,\n[Artist Name]",
    waiverReminderSubject: "Waiver Reminder",
    waiverReminderBody: "HI (client first name)! Just a heads-up — your waiver's still incomplete. Please sign it before you arrive.",
    healingCheckInSubject: "Healing Check-In",
    healingCheckInBody: "Hi (client first name)! Hope your tattoo's healing up great! If you have any questions or want to send a healed photo, you can do that right through your profile.",
    cancellationNotificationSubject: "Someone Canceled - New Spot Open",
    cancellationNotificationBody: "A spot just opened for [Date] [Time]! Tap below to claim it before it's gone.",
}