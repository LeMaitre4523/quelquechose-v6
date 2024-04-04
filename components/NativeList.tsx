import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import GetUIColors from '../utils/GetUIColors';
import mapChildrenWithKeys from '../utils/mapChildrenWithKeys';

interface Props {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  style?: ViewStyle
  containerStyle?: ViewStyle
  plain?: boolean
}

const NativeList: React.FC<Props> = React.memo(({
  children,
  header,
  footer,
  style,
  containerStyle,
  plain,
}) => {
  const UIColors = GetUIColors(null, plain ? 'ios' : null);
  const childrenWithKeys = mapChildrenWithKeys(children);

  return (
    <List.Section style={[styles.container, style]}>
      {header && <List.Subheader>{header}</List.Subheader>}

      <View style={[styles.children, plain && styles.plain, containerStyle]}>
        {childrenWithKeys}
      </View>

      {footer && <List.Subheader>{footer}</List.Subheader>}
    </List.Section>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  children: {
    marginHorizontal: 16,
    borderRadius: 0,
    overflow: 'hidden',
    gap: 3,
  },
  plain: {
    borderWidth: 0,
  },
});

export default NativeList;
