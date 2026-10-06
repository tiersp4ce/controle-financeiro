import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreditCardInvoiceSummary } from '../../domain/entities/credit-card-invoice';
import { CreditCardConfig } from '../../domain/entities/credit-card-config';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr } from '../../core/utils/date';
import { ConfirmInvoicePaymentModal } from './ConfirmInvoicePaymentModal';

interface CreditCardInvoiceCardProps {
  invoice: CreditCardInvoiceSummary;
  cardConfig: CreditCardConfig | null;
  onPayInvoice: () => void | Promise<void>;
  onOpenAdvanceModal: () => void;
  onConfigureCard: () => void;
}

export const CreditCardInvoiceCard: React.FC<CreditCardInvoiceCardProps> = ({
  invoice,
  cardConfig,
  onPayInvoice,
  onOpenAdvanceModal,
  onConfigureCard,
}) => {
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  if (!cardConfig || !cardConfig.isEnabled) {
    return (
      <TouchableOpacity style={styles.bannerContainer} onPress={onConfigureCard}>
        <Ionicons name="card-outline" size={22} color="#FFA726" />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Configurar Fatura do Cartão</Text>
          <Text style={styles.bannerSubtitle}>
            Defina o dia que fecha e vence para calcular o melhor dia de compra.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#888" />
      </TouchableOpacity>
    );
  }

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'PAID':
        return { label: 'Fatura Paga', bg: '#00E67622', color: '#00E676', icon: 'checkmark-circle' };
      case 'CLOSED':
        return { label: 'Fatura Fechada', bg: '#FF980022', color: '#FF9800', icon: 'lock-closed' };
      case 'FUTURE':
        return { label: 'Fatura Futura', bg: '#2196F322', color: '#2196F3', icon: 'calendar-outline' };
      case 'OPEN':
      default:
        return { label: 'Fatura Aberta', bg: '#03DAC622', color: '#03DAC6', icon: 'radio-button-on' };
    }
  };

  const badge = getStatusBadge();
  const isPaid = invoice.status === 'PAID';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="card" size={20} color="#03DAC6" />
          <Text style={styles.cardName}>{cardConfig.cardName || 'Cartão de Crédito'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon as any} size={12} color={badge.color} />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Total da Fatura ({invoice.invoiceMonth})</Text>
        <Text style={[styles.amountValue, isPaid && { color: '#4CAF50' }]}>
          {centsToCurrency(invoice.totalAmountCents)}
        </Text>
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Fecha em</Text>
          <Text style={styles.dateValue}>{formatDateBr(invoice.closingDate)}</Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Vence em</Text>
          <Text style={styles.dateValue}>{formatDateBr(invoice.dueDate)}</Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Compras</Text>
          <Text style={styles.dateValue}>{invoice.transactionsCount} itens</Text>
        </View>
      </View>

      {/* Ações da Fatura */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.advanceButton}
          onPress={onOpenAdvanceModal}
        >
          <Ionicons name="flash-outline" size={15} color="#03DAC6" />
          <Text style={styles.advanceButtonText}>Antecipar Parcelas</Text>
        </TouchableOpacity>

        {!isPaid && invoice.totalAmountCents > 0 && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setIsConfirmModalVisible(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color="#FFF" />
            <Text style={styles.payButtonText}>Marcar como Paga</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmInvoicePaymentModal
        visible={isConfirmModalVisible}
        invoice={invoice}
        cardName={cardConfig.cardName}
        onConfirm={async () => {
          await onPayInvoice();
        }}
        onClose={() => setIsConfirmModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A14',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFA72644',
  },
  bannerContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  bannerTitle: {
    color: '#FFA726',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountSection: {
    marginVertical: 4,
  },
  amountLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  amountValue: {
    color: '#FF5252',
    fontSize: 24,
    fontWeight: 'bold',
  },
  datesRow: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#2A2A2A',
  },
  dateLabel: {
    color: '#777',
    fontSize: 11,
    marginBottom: 2,
  },
  dateValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  advanceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142828',
    borderWidth: 1,
    borderColor: '#03DAC655',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  advanceButtonText: {
    color: '#03DAC6',
    fontSize: 12,
    fontWeight: '600',
  },
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
