import React from 'react';
import { View, StyleSheet, TouchableNativeFeedback, type ViewStyle } from 'react-native';
import type { Cell } from 'react-native-tableview-simple';

interface Props {
  children: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  onPress?: () => unknown
  chevron?: boolean
  cellProps?: Partial<React.ComponentProps<typeof Cell>>
  style?: ViewStyle
  innerStyle?: ViewStyle
  backgroundColor?: string
}

const NativeItem: React.FC<Props> = ({ 
  children,
  leading,
  trailing,
  onPress,
  style,
  innerStyle,
}) => {
  return (
    <TouchableNativeFeedback
      style={style}
      onPress={() => onPress?.()}
    >
      <View style={[styles.content, innerStyle]}>
        {leading && (
          <View>
            {leading}
          </View>
        )}

        <View style={styles.children}>
          {children}
        </View>

        {trailing && (
          <View>
            {trailing}
          </View>
        )}
      </View>
    </TouchableNativeFeedback>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  children: {
    flex: 1,
  }
});

export default NativeItem;
