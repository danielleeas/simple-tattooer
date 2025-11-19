import React from 'react';
import { View, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '@/components/ui/text';
import { useSetupWizard } from '@/lib/contexts/setup-wizard-context';
import { Input } from '@/components/ui/input';
import { Note } from '@/components/ui/note';
import { Checkbox } from "@/components/ui/checkbox"

export function PaymentMethodStep() {

    const { paymentMethod, updatePaymentMethod } = useSetupWizard();

    return (
        <KeyboardAwareScrollView bottomOffset={50} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-6 pb-4">
                <View className="items-center justify-center pb-2">
                    <Image
                        source={require('@/assets/images/icons/payments.png')}
                        style={{ width: 60, height: 60 }}
                        resizeMode="contain"
                    />
                    <Text variant="h6" className="text-center uppercase">set payment</Text>
                    <Text variant="h6" className="text-center uppercase leading-none">methods</Text>
                    <Text className="text-center mt-2 text-text-secondary">Choose the payment types you accept</Text>
                    <Text className="text-center text-text-secondary">and add your link/details for deposits.</Text>
                </View>
                <View className="gap-6">
                    <View className="gap-3">
                        <View className="flex flex-row items-center gap-3">
                            <Checkbox
                                id="terms"
                                checked={paymentMethod.paypal.isPayPal}
                                onCheckedChange={(checked) => updatePaymentMethod({ paypal: { isPayPal: checked, email: paymentMethod.paypal.email } })}
                            />
                            <Text
                                className='flex-1'
                                onPress={() => updatePaymentMethod({ paypal: { isPayPal: !paymentMethod.paypal.isPayPal, email: paymentMethod.paypal.email } })}
                                variant="h5"
                            >
                                Paypal
                            </Text>
                        </View>
                        {paymentMethod.paypal.isPayPal && (
                            <View className="flex flex-row items-center gap-3">
                                <Input placeholder="Add email or link" value={paymentMethod.paypal.email} onChangeText={(text) => updatePaymentMethod({ paypal: { isPayPal: paymentMethod.paypal.isPayPal, email: text } })} />
                            </View>
                        )}
                    </View>

                    <View className="gap-3">
                        <View className='gap-1'>
                            <View className="flex flex-row items-center gap-3">
                                <Checkbox
                                    id="terms"
                                    checked={paymentMethod.eTransfer.isETransfer}
                                    onCheckedChange={(checked) => updatePaymentMethod({ eTransfer: { isETransfer: checked, emailOrPhone: paymentMethod.eTransfer.emailOrPhone } })}
                                />
                                <Text
                                    className='flex-1'
                                    onPress={() => updatePaymentMethod({ eTransfer: { isETransfer: !paymentMethod.eTransfer.isETransfer, emailOrPhone: paymentMethod.eTransfer.emailOrPhone } })}
                                    variant="h5"
                                >
                                    E-Transfer
                                </Text>
                            </View>
                            <Text variant="small" style={{ marginLeft: 32 }} className="text-text-secondary leading-none">Canada Only</Text>
                        </View>
                        {paymentMethod.eTransfer.isETransfer && (
                            <View className="flex flex-row items-center gap-3">
                                <Input placeholder="Add email or phone number" value={paymentMethod.eTransfer.emailOrPhone} onChangeText={(text) => updatePaymentMethod({ eTransfer: { isETransfer: paymentMethod.eTransfer.isETransfer, emailOrPhone: text } })} />
                            </View>
                        )}
                    </View>

                    <View className="gap-3">
                        <View className="flex flex-row items-center gap-3">
                            <Checkbox
                                id="terms"
                                checked={paymentMethod.creditCard.isCreditCard}
                                onCheckedChange={(checked) => updatePaymentMethod({ creditCard: { isCreditCard: checked, cardLink: paymentMethod.creditCard.cardLink } })}
                            />
                            <Text
                                className='flex-1'
                                onPress={() => updatePaymentMethod({ creditCard: { isCreditCard: !paymentMethod.creditCard.isCreditCard, cardLink: paymentMethod.creditCard.cardLink } })}
                                variant="h5"
                            >
                                Credit Card
                            </Text>
                        </View>
                        {paymentMethod.creditCard.isCreditCard && (
                            <View className="flex flex-row items-center gap-3">
                                <Input placeholder="Add link to Square or Stripe" value={paymentMethod.creditCard.cardLink} onChangeText={(text) => updatePaymentMethod({ creditCard: { isCreditCard: paymentMethod.creditCard.isCreditCard, cardLink: text } })} />
                            </View>
                        )}
                    </View>

                    <View className="gap-3">
                        <View className='gap-1'>
                            <View className="flex flex-row items-center gap-3">
                                <Checkbox
                                    id="terms"
                                    checked={paymentMethod.venmo.isVenmo}
                                    onCheckedChange={(checked) => updatePaymentMethod({ venmo: { isVenmo: checked, emailOrPhone: paymentMethod.venmo.emailOrPhone } })}
                                />
                                <Text
                                    className='flex-1'
                                    onPress={() => updatePaymentMethod({ venmo: { isVenmo: !paymentMethod.venmo.isVenmo, emailOrPhone: paymentMethod.venmo.emailOrPhone } })}
                                    variant="h5"
                                >
                                    Venmo
                                </Text>
                            </View>
                            <Text variant="small" style={{ marginLeft: 32 }} className="text-text-secondary leading-none">US Only</Text>
                        </View>
                        {paymentMethod.venmo.isVenmo && (
                            <View className="flex flex-row items-center gap-3">
                                <Input placeholder="Add link to Venmo" value={paymentMethod.venmo.emailOrPhone} onChangeText={(text) => updatePaymentMethod({ venmo: { isVenmo: paymentMethod.venmo.isVenmo, emailOrPhone: text } })} />
                            </View>
                        )}
                    </View>

                    <Note
                        message="You can add this later in Settings."
                        thirdMessage="Note: In-person card payments are handled through your POS, not this app."
                    />
                </View>
            </View>
        </KeyboardAwareScrollView>
    )
}