import { Theme } from '@mui/material/styles';

export const getTextFieldStyle = (theme: Theme) => ({
    color: theme.palette.mode === 'dark'
        ? theme.palette.common.white
        : theme.palette.text.primary,
});