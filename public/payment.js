document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const amountInRupees = parseFloat(document.getElementById('amount').value);
        const subjectCheckboxes = document.querySelectorAll('input[name="subjects"]:checked');
        const subjects = Array.from(subjectCheckboxes).map(cb => cb.value);
        console.log('Selected subjects:', subjects);
        // Razorpay expects amount in the smallest currency unit (e.g., paise for INR)
        const amountInPaise = Math.round(amountInRupees * 100);
        const description = document.getElementById('description').value;
        const grade = document.getElementById('grade').value;
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const paymentStatusDiv = document.getElementById('paymentStatus');
        paymentStatusDiv.className = '';
        paymentStatusDiv.textContent = 'Initiating payment... Please wait.';

        const BACKEND_URL = 'https://tuitionfee.lushaitech.com';
        try {
    
            const createOrderResponse = await fetch(`${BACKEND_URL}/api/create-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountInPaise,
                    description: description,
                    name: name,
                    subjects: subjects,
                    grade: grade,
                })
            });

            if (!createOrderResponse.ok) {
                const errorData = await createOrderResponse.json();
                throw new Error(errorData.error || 'Failed to create order on backend.');
            }

            const orderData = await createOrderResponse.json();
            const razorpayOrderId = orderData.id;

          
            const keyRes = await fetch(`${BACKEND_URL}/api/razorpay-key`);
            if (!keyRes.ok) {
                throw new Error('Failed to fetch Razorpay Key ID');
            }
            const keyData = await keyRes.json();
            const RAZORPAY_KEY_ID = keyData.key;

     
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: amountInPaise,
                currency: 'INR',
                name: 'LushAITech',
                description: description,
                order_id: razorpayOrderId,
                handler: async function (response) {
                    paymentStatusDiv.className = '';
                    paymentStatusDiv.textContent = 'Payment successful! Verifying with backend...';
                    try {
                        const verifyResponse = await fetch(`${BACKEND_URL}/api/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                name: name,
                                subjects: subjects,
                            })
                        });
                        const contentType = verifyResponse.headers.get('Content-Type');
                        if (verifyResponse.ok && contentType && contentType.includes('application/pdf')) {
                            const pdfBlob = await verifyResponse.blob();
                            const pdfUrl = URL.createObjectURL(pdfBlob);
                            paymentStatusDiv.className = 'success';
                            paymentStatusDiv.textContent = 'Payment successfully verified and recorded!';
                            const modal = document.getElementById('receiptModal');
                            modal.style.display = 'flex';
                            const openBtn = document.getElementById('openReceiptBtn');
                            openBtn.onclick = (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                window.open(pdfUrl, '_blank');
                            };
                            const closeBtn = document.getElementById('closeModalBtn');
                            closeBtn.onclick = (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                modal.style.display = 'none';
                                paymentStatusDiv.textContent = '';
                                paymentStatusDiv.className = '';
                            };
                        } else {
                            const verifyResult = await verifyResponse.json();
                            if (verifyResponse.ok && verifyResult.success) {
                                paymentStatusDiv.className = 'success';
                                paymentStatusDiv.textContent = 'Payment successfully verified and recorded!';
                                const modal = document.getElementById('receiptModal');
                                modal.style.display = 'flex';
                                const openBtn = document.getElementById('openReceiptBtn');
                                openBtn.onclick = () => {
                                    modal.style.display = 'none';
                                };
                                openBtn.textContent = 'OK';
                                document.getElementById('closeModalBtn').style.display = 'none';
                            } else {
                                throw new Error(verifyResult.error || 'Payment verification failed.');
                            }
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        paymentStatusDiv.className = 'error';
                        paymentStatusDiv.textContent = `Payment verification failed: ${error.message}`;
                    }
                },
                prefill: {
                    name: name,
                    email: email,
                    contact: phone,
                },
                notes: {
                    'app_description': "LushAi",
                    name: name,
                    email: email,
                    phone: phone,
                    grade: grade,
                    subjects: subjects.join ? subjects.join(', ') : subjects
                },
                theme: {
                    "color": "#3399CC"
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                paymentStatusDiv.className = 'error';
                paymentStatusDiv.textContent = `Payment failed: ${response.error.description || 'Unknown error'}`;
                alert(`Payment failed: ${response.error.description}`);
            });

            rzp.open();
            // Handle Razorpay modal dismissal (user exits without paying)
            rzp.on('modal.closed', function () {
                paymentStatusDiv.className = 'error';
                paymentStatusDiv.textContent = 'Payment was not completed. You exited the payment window.';
            });
        } catch (error) {
            console.error('Error initiating payment:', error);
            paymentStatusDiv.className = 'error';
            paymentStatusDiv.textContent = `Error: ${error.message}`;
        }
    });
});
