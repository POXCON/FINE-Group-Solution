import { useSnackbar as useNotistackSnackbar } from 'notistack';

type SeverityType = 'success' | 'info' | 'warning' | 'error';

export const useSnackbar = () => {
    const { enqueueSnackbar } = useNotistackSnackbar();

    const showSnackbar = (message: string, severity: SeverityType) => {
        enqueueSnackbar(message, { variant: severity });
    };

    return { showSnackbar };
};  