// Date.now() method returns the number of milliseconds, so divide by 1000 to get Epoch format
// And the floor it to have an interger for the Stripe API
export const getProrationDate = () => Math.floor(Date.now() / 1000);
