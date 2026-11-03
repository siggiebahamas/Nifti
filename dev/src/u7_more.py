# U7: audit trail wording for the bookkeeping actions
from patchlib import P
P("""  referral_joined:'Referral joined', role_reassigned:'Role reassigned', saved_view_created:'Saved view created', sku_merge:'SKU merge',
};""", """  referral_joined:'Referral joined', role_reassigned:'Role reassigned', saved_view_created:'Saved view created', sku_merge:'SKU merge',
  expense_edited:'Expense changed', expense_removed:'Expense removed', sale_voided:'Sale removed', cash_counted:'Cash counted', cash_reopened:'Cash count reopened',
};""")
