import React from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { ShieldCheck } from 'lucide-react';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  fullHeight?: boolean;
  noPadding?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  maxWidth = 'lg',
  showHeader = true,
  headerContent,
  fullHeight = true,
  noPadding = false,
}) => {
  return (
    <Box
      sx={{
        minHeight: fullHeight ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {showHeader && (
        <AppBar
          position="sticky"
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  p: 0.75,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} color="white" />
              </Box>
              <Typography
                variant="h6"
                component="h1"
                sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                {title || 'Arcanjo PLD'}
              </Typography>
            </Box>
            {headerContent}
          </Toolbar>
        </AppBar>
      )}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {maxWidth ? (
          <Container
            maxWidth={maxWidth}
            sx={{
              py: noPadding ? 0 : 3,
              px: noPadding ? 0 : undefined,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </Container>
        ) : (
          <Box sx={{ flex: 1, p: noPadding ? 0 : 3 }}>{children}</Box>
        )}
      </Box>
    </Box>
  );
};
