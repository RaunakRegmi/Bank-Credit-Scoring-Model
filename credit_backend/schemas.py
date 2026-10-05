from pydantic import BaseModel

class LoanRequest(BaseModel):
    account_no: str
    transaction_amount: float
    loan_amount: float
    type_of_good: str