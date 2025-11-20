import { Pressable, View } from "react-native";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { DepositDataProps, timesChunks } from "./type";
import { Input } from "@/components/ui/input";
import { Collapse } from "@/components/lib/collapse";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface DepositProps {
    depositData: DepositDataProps;
    updateDepositData: (updates: Partial<DepositDataProps>) => void;
}

export const Deposit = ({ depositData, updateDepositData }: DepositProps) => {
    const [depositInput, setDepositInput] = useState<string | null>(null);

    return (
        <View className="gap-6 mt-4">
            <View className="flex-row items-center justify-between">
                <Text variant="h5">Deposit Amount</Text>
                <View className="w-20">
                    <Input
                        className="h-8"
                        value={depositInput !== null ? depositInput : (depositData.depositAmount?.toString() || '')}
                        onChangeText={(text) => {
                            setDepositInput(text);
                            if (text.trim() === '') {
                                return;
                            }

                            const amount = parseInt(text);
                            if (!isNaN(amount)) {
                                updateDepositData({ depositAmount: amount });
                            }
                        }}
                    />
                </View>
            </View>

            <View className="items-start gap-2">
                <Collapse title="Default Hold Time hrs/days" textClassName="text-xl" description="Gives clients time to pay">
                    <RadioGroup value={depositData.depositHoldTime?.toString() || '12'} onValueChange={(value) => updateDepositData({ depositHoldTime: parseInt(value) })}>
                        {timesChunks.map((times) => (
                            <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                {times.map((time) => (
                                    <Pressable onPress={() => updateDepositData({ depositHoldTime: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                        <RadioGroupItem value={time.value} id={time.value} className={depositData.depositHoldTime?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                        <Text>{time.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ))}
                    </RadioGroup>
                </Collapse>
            </View>

            <View className="items-start gap-2">
                <Collapse title="Deposit Reminder" textClassName="text-xl" description="Deposit payment reminder sent out after X hours">
                    <RadioGroup value={depositData.depositRemindTime?.toString() || '12'} onValueChange={(value) => updateDepositData({ depositRemindTime: parseInt(value) })}>
                        {timesChunks.map((times) => (
                            <View key={times.map((time) => time.value).join(',')} className='flex-row items-center gap-3'>
                                {times.map((time) => (
                                    <Pressable onPress={() => updateDepositData({ depositRemindTime: parseInt(time.value) })} key={time.value} className="flex-1 h-6 flex-row items-center gap-3">
                                        <RadioGroupItem value={time.value} id={time.value} className={depositData.depositRemindTime?.toString() === time.value ? 'border-border-white' : 'border-border-secondary'} />
                                        <Text>{time.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ))}
                    </RadioGroup>
                </Collapse>
            </View>

            <View className="gap-2">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => updateDepositData({ paypalEnabled: !depositData.paypalEnabled })} className="flex-1">
                        <Text variant="h5">Paypal</Text>
                    </Pressable>
                    <Switch
                        checked={depositData.paypalEnabled || false}
                        onCheckedChange={(checked) => updateDepositData({ paypalEnabled: checked })}
                    />
                </View>
                {depositData.paypalEnabled && (
                    <View className="flex-row items-center justify-between">
                        <Input
                            placeholder="Add email or link"
                            value={depositData.paypalMethod || ''}
                            onChangeText={(text) => updateDepositData({ paypalMethod: text })}
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                        />
                    </View>
                )}
            </View>

            <View className="gap-1">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => updateDepositData({ etransferEnabled: !depositData.etransferEnabled })} className="flex-1">
                        <Text variant="h5" className="leading-5">E-Transfer</Text>
                    </Pressable>
                    <Switch
                        checked={depositData.etransferEnabled || false}
                        onCheckedChange={(checked) => updateDepositData({ etransferEnabled: checked })}
                    />
                </View>
                <Text variant="small" className="text-text-secondary leading-none">Canada Only</Text>
                {depositData.etransferEnabled && (
                    <View className="flex-row items-center justify-between">
                        <Input
                            placeholder="Add email or link"
                            value={depositData.etransferMethod || ''}
                            onChangeText={(text) => updateDepositData({ etransferMethod: text })}
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                        />
                    </View>
                )}
            </View>

            <View className="gap-2">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => updateDepositData({ creditcardEnabled: !depositData.creditcardEnabled })} className="flex-1">
                        <Text variant="h5">Credit Card</Text>
                    </Pressable>
                    <Switch
                        checked={depositData.creditcardEnabled || false}
                        onCheckedChange={(checked) => updateDepositData({ creditcardEnabled: checked })}
                    />
                </View>
                {depositData.creditcardEnabled && (
                    <View className="flex-row items-center justify-between">
                        <Input
                            placeholder="Add email or link"
                            value={depositData.creditcardMethod || ''}
                            onChangeText={(text) => updateDepositData({ creditcardMethod: text })}
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                        />
                    </View>
                )}
            </View>

            <View className="gap-1">
                <View className="flex-row items-center justify-between">
                    <Pressable onPress={() => updateDepositData({ venmoEnabled: !depositData.venmoEnabled })} className="flex-1">
                        <Text variant="h5" className="leading-5">Venmo</Text>
                    </Pressable>
                    <Switch
                        checked={depositData.venmoEnabled || false}
                        onCheckedChange={(checked) => updateDepositData({ venmoEnabled: checked })}
                    />
                </View>
                <Text variant="small" className="text-text-secondary leading-none">US Only</Text>
                {depositData.venmoEnabled && (
                    <View className="flex-row items-center justify-between">
                        <Input
                            placeholder="Add email or link"
                            value={depositData.venmoMethod || ''}
                            onChangeText={(text) => updateDepositData({ venmoMethod: text })}
                            spellCheck={false}
                            autoCorrect={false}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoFocus={false}
                        />
                    </View>
                )}
            </View>
        </View>
    )
}