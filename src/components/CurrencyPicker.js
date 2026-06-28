import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getCurrencySymbol } from '../utils/currency';

const CurrencyPicker = ({ visible, onClose, onSelect, selectedCurrency, currencies }) => {
  const { theme } = useTheme();

  const renderItem = ({ item }) => {
    const isSelected = item.code === selectedCurrency;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: theme.colors.surface, borderColor: isSelected ? theme.colors.primary : theme.colors.border },
        ]}
        onPress={() => {
          onSelect(item.code);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <Text style={[styles.symbol, { color: theme.colors.primary }]}>{getCurrencySymbol(item.code)}</Text>
          <View>
            <Text style={[styles.code, { color: theme.colors.text }]}>{item.code}</Text>
            <Text style={[styles.name, { color: theme.colors.textSecondary }]}>{item.name}</Text>
          </View>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Select Currency</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '800',
    width: 40,
    textAlign: 'center',
  },
  code: {
    fontSize: 15,
    fontWeight: '700',
  },
  name: {
    fontSize: 12,
    marginTop: 1,
  },
});

export default CurrencyPicker;
