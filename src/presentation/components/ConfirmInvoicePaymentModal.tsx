import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreditCardInvoiceSummary } from '../../domain/entities/credit-card-invoice';
import { centsToCurrency } from '../../core/utils/currency';
import { formatDateBr } from '../../core/utils/date';

interface ConfirmInvoicePaymentModalProps {
  visible: boolean;
  invoice: CreditCardInvoiceSummary | null;
  cardName?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/**
 * Modal de confirmação segura para quitação da fatura de cartão de crédito.
 * Exibe resumo dos valores em centavos formatados, data de vencimento e aviso prévio.
 */
export const ConfirmInvoicePaymentModal: React.FC<ConfirmInvoicePaymentModalProps> = ({
  visible,
  invoice,
  cardName = 'Cartão de Crédito',
  onConfirm,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Erro ao quitar fatura:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="card" size={32} color="#00E676" />
          </View>

          <Text style={styles.title}>Quitar Fatura</Text>
          <Text style={styles.subtitle}>{cardName} • Fatura {invoice.invoiceMonth}</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.amountLabel}>Valor Total a Pagar</Text>
            <Text style={styles.amountValue}>{centsToCurrency(invoice.totalAmountCents)}</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>Vencimento: {formatDateBr(invoice.dueDate)}</Text>
              <Text style={styles.detailText}>{invoice.transactionsCount} compras</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={18} color="#FFA726" />
            <Text style={styles.warningText}>
              Todas as transações desta fatura serão marcadas como pagas e constarão como quitadas.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Voltar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={isSubmitting}>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={styles.confirmButtonText}>
                {isSubmitting ? 'Quitando...' : 'Confirmar Pagamento'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00E67622',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 14,
  },
  amountLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    color: '#00E676',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#242424',
    paddingTop: 8,
  },
  detailText: {
    color: '#AAA',
    fontSize: 12,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#2A2012',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFA72644',
    marginBottom: 20,
  },
  warningText: {
    color: '#FFA726',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
