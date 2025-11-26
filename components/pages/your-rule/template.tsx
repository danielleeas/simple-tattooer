import { View, Image, Pressable } from "react-native";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { TemplateDataProps } from "./type";
import { Collapse } from "@/components/lib/collapse";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { ChevronUp, ChevronDown } from "lucide-react-native";

interface TemplateProps {
    templateData: TemplateDataProps;
    updateTemplateData: (updates: Partial<TemplateDataProps>) => void;
}

export const Template = ({ templateData, updateTemplateData }: TemplateProps) => {
    const [approvalEmailsColOpened, setApprovalEmailsColOpened] = useState(false);
    const [depositEmailsColOpened, setDepositEmailsColOpened] = useState(false);
    const [consultEmailsColOpened, setConsultEmailsColOpened] = useState(false);
    const [appointmentEmailColOpened, setAppointmentEmailColOpened] = useState(false);
    const [reminderEmailColOpenned, setReminderEmailColOpenned] = useState(false);

    return (
        <View className="gap-6 mt-4">
            <Pressable onPress={() => setApprovalEmailsColOpened(!approvalEmailsColOpened)} className="flex-row items-center gap-2">
                <Image
                    source={require('@/assets/images/icons/line_check_circle.png')}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
                <View className="flex-1">
                    <Text variant="h4">Approval emails</Text>
                </View>
                <Icon as={approvalEmailsColOpened ? ChevronUp : ChevronDown} size={24} strokeWidth={2} />
            </Pressable>
            {approvalEmailsColOpened && (
                <View className="gap-6">
                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">New Booking Request Received (Artist)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.newBookingRequestReceivedSubject || ''}
                            onChangeText={(text) => updateTemplateData({ newBookingRequestReceivedSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.newBookingRequestReceivedBody || ''}
                            onChangeText={(text) => updateTemplateData({ newBookingRequestReceivedBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent when request received</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Booking request approved (auto booking)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.bookingRequestApprovedAutoSubject || ''}
                            onChangeText={(text) => updateTemplateData({ bookingRequestApprovedAutoSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.bookingRequestApprovedAutoBody || ''}
                            onChangeText={(text) => updateTemplateData({ bookingRequestApprovedAutoBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary max-w-72 leading-5">Triggered after this quote is made and auto booking is on</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Booking request approved (manual booking)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.bookingRequestApprovedManualSubject || ''}
                            onChangeText={(text) => updateTemplateData({ bookingRequestApprovedManualSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.bookingRequestApprovedManualBody || ''}
                            onChangeText={(text) => updateTemplateData({ bookingRequestApprovedManualBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary leading-5">Triggered when Client is approved, artist manually chooses appointment dates and fills this quote.</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Declined Booking Request</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.declinedBookingRequestSubject || ''}
                            onChangeText={(text) => updateTemplateData({ declinedBookingRequestSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.declinedBookingRequestBody || ''}
                            onChangeText={(text) => updateTemplateData({ declinedBookingRequestBody: text })}
                            placeholder="Body"
                        />
                    </View>
                </View>
            )}

            <Pressable onPress={() => setDepositEmailsColOpened(!depositEmailsColOpened)} className="flex-row items-center gap-2">
                <Image
                    source={require('@/assets/images/icons/deposit.png')}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
                <View className="flex-1">
                    <Text variant="h4">Deposit emails</Text>
                </View>
                <Icon as={depositEmailsColOpened ? ChevronUp : ChevronDown} size={24} strokeWidth={2} />
            </Pressable>
            {depositEmailsColOpened && (
                <View className="gap-6">
                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Deposit Reminder</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.depositPaymentReminderSubject || ''}
                            onChangeText={(text) => updateTemplateData({ depositPaymentReminderSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.depositPaymentReminderBody || ''}
                            onChangeText={(text) => updateTemplateData({ depositPaymentReminderBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent if deposit is not paid by default hold time</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Deposit Forfeit  (Auto Booking)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.depositForfeitSubject || ''}
                            onChangeText={(text) => updateTemplateData({ depositForfeitSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.depositForfeitBody || ''}
                            onChangeText={(text) => updateTemplateData({ depositForfeitBody: text })}
                            placeholder="Body"
                        />
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Deposit Kept on File</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.depositKeepSubject || ''}
                            onChangeText={(text) => updateTemplateData({ depositKeepSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.depositKeepBody || ''}
                            onChangeText={(text) => updateTemplateData({ depositKeepBody: text })}
                            placeholder="Body"
                        />
                    </View>
                </View>
            )}

            <Pressable onPress={() => setConsultEmailsColOpened(!consultEmailsColOpened)} className="flex-row items-center gap-2">
                <Image
                    source={require('@/assets/images/icons/consult.png')}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
                <View className="flex-1">
                    <Text variant="h4">Consult emails</Text>
                </View>
                <Icon as={consultEmailsColOpened ? ChevronUp : ChevronDown} size={24} strokeWidth={2} />
            </Pressable>
            {consultEmailsColOpened && (
                <View className="gap-6">
                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Consult Confirmation (Zoom or In-Person)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.consultConfirmationSubject || ''}
                            onChangeText={(text) => updateTemplateData({ consultConfirmationSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.consultConfirmationBody || ''}
                            onChangeText={(text) => updateTemplateData({ consultConfirmationBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent immediately after client books consult.</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Consult Reminder</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.consultReminderSubject || ''}
                            onChangeText={(text) => updateTemplateData({ consultReminderSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.consultReminderBody || ''}
                            onChangeText={(text) => updateTemplateData({ consultReminderBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent 24 hours before consult automatically</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Declined Consult Request</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.consultDeclinedSubject || ''}
                            onChangeText={(text) => updateTemplateData({ consultDeclinedSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.consultDeclinedBody || ''}
                            onChangeText={(text) => updateTemplateData({ consultDeclinedBody: text })}
                            placeholder="Body"
                        />
                    </View>
                </View>
            )}

            <Pressable onPress={() => setAppointmentEmailColOpened(!appointmentEmailColOpened)} className="flex-row items-center gap-2">
                <Image
                    source={require('@/assets/images/icons/appointment.png')}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
                <View className="flex-1">
                    <Text variant="h4">Appointment emails</Text>
                </View>
                <Icon as={appointmentEmailColOpened ? ChevronUp : ChevronDown} size={24} strokeWidth={2} />
            </Pressable>
            {appointmentEmailColOpened && (
                <View className="gap-6">
                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Appointment Confirmation Email (NEW CLIENT-No Profile) (Deposit Paid)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.appointmentConfirmationNoProfileSubject || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentConfirmationNoProfileSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.appointmentConfirmationNoProfileBody || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentConfirmationNoProfileBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent when deposit is toggled “paid”</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Appointment Confirmation </Text>
                        <Text variant="h5" className="tracking-tight leading-none">(RETURNING CLIENT - Deposit Paid)</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.appointmentConfirmationWithProfileSubject || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentConfirmationWithProfileSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.appointmentConfirmationWithProfileBody || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentConfirmationWithProfileBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent when deposit is toggled “paid”</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Final Appointment Confirmation</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.appointmentFinalConfirmationSubject || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentFinalConfirmationSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.appointmentFinalConfirmationBody || ''}
                            onChangeText={(text) => updateTemplateData({ appointmentFinalConfirmationBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">If drawing upload, send at Drawing Delivery Time. If no drawing, Sent at Final Appointment Reminder time.</Text>
                    </View>
                </View>
            )}

            <Pressable onPress={() => setReminderEmailColOpenned(!reminderEmailColOpenned)} className="flex-row items-center gap-2">
                <Image
                    source={require('@/assets/images/icons/bell.png')}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
                <View className="flex-1">
                    <Text variant="h4">Reminder emails</Text>
                </View>
                <Icon as={reminderEmailColOpenned ? ChevronUp : ChevronDown} size={24} strokeWidth={2} />
            </Pressable>
            {reminderEmailColOpenned && (
                <View className="gap-6">
                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Waiver Reminder</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.waiverReminderSubject || ''}
                            onChangeText={(text) => updateTemplateData({ waiverReminderSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.waiverReminderBody || ''}
                            onChangeText={(text) => updateTemplateData({ waiverReminderBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Morning of Appointment</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Healing Check-In</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.healingCheckInSubject || ''}
                            onChangeText={(text) => updateTemplateData({ healingCheckInSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.healingCheckInBody || ''}
                            onChangeText={(text) => updateTemplateData({ healingCheckInBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent one week after appointment</Text>
                    </View>

                    <View className="gap-2">
                        <Text variant="h5" className="tracking-tight">Cancellation Opportunity Notification</Text>
                        <Text variant="small">Subject</Text>
                        <Input
                            value={templateData.cancellationNotificationSubject || ''}
                            onChangeText={(text) => updateTemplateData({ cancellationNotificationSubject: text })}
                            placeholder="Subject"
                        />
                        <Text variant="small">Body Email</Text>
                        <Textarea
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                            className="min-h-32"
                            value={templateData.cancellationNotificationBody || ''}
                            onChangeText={(text) => updateTemplateData({ cancellationNotificationBody: text })}
                            placeholder="Body"
                        />
                        <Text variant="small" className="text-text-secondary">Sent when Cancellation List is triggered and they meet parameters.</Text>
                    </View>
                </View>
            )}
        </View>
    );
}