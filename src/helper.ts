export const findFuncById = (id, buttons) => {
    for (const key in buttons) {
        if (buttons[key].id === id) {
            return buttons[key].func;
        }
    }
    return null; // If not found
};

export const findButtonNameById = (id, buttons) => {
    for (const key in buttons) {
        if (buttons[key].id === id) {
            return key;
        }
    }
    return null; // If not found
};