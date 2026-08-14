<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

function respond(int $code, array $data): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'Method Not Allowed']);
}

$token = $_SERVER['HTTP_X_RELAY_TOKEN'] ?? '';
if (!hash_equals(RELAY_TOKEN, $token)) {
    respond(401, ['error' => 'Unauthorized']);
}

$input = json_decode(file_get_contents('php://input'), true);
$to = filter_var($input['to'] ?? '', FILTER_VALIDATE_EMAIL);
$subject = trim((string)($input['subject'] ?? ''));
$html = (string)($input['html'] ?? '');
$fromEmail = filter_var($input['fromEmail'] ?? FROM_EMAIL, FILTER_VALIDATE_EMAIL);
$fromName = trim((string)($input['fromName'] ?? FROM_NAME));

if (!$to || !$subject || !$html || !$fromEmail) {
    respond(400, ['error' => 'Invalid payload']);
}

$connection = @stream_socket_client(
    'ssl://' . SMTP_HOST . ':' . SMTP_PORT,
    $errno,
    $errstr,
    15
);

if (!$connection) {
    respond(502, ['error' => 'SMTP connect failed: ' . $errstr]);
}

$greeting = smtpRead($connection);
if (substr($greeting, 0, 3) !== '220') {
    throw new RuntimeException('SMTP greeting error: ' . trim($greeting));
}

function smtpRead($connection): string
{
    $response = '';
    do {
        $line = fgets($connection, 512);
        if ($line === false) {
            throw new RuntimeException('SMTP connection closed');
        }
        $response .= $line;
        $separator = substr($line, 3, 1);
    } while ($separator === '-');
    return $response;
}

function smtpCommand($connection, string $command, int $expected): void
{
    fwrite($connection, $command . "\r\n");
    $response = smtpRead($connection);
    if (substr($response, 0, 3) !== (string)$expected) {
        throw new RuntimeException('SMTP error: ' . trim($response));
    }
}

try {
    smtpCommand($connection, 'EHLO mail.59pk.net', 250);
    smtpCommand($connection, 'AUTH LOGIN', 334);
    smtpCommand($connection, base64_encode(SMTP_USER), 334);
    smtpCommand($connection, base64_encode(SMTP_PASS), 235);
    smtpCommand($connection, 'MAIL FROM:<' . $fromEmail . '>', 250);
    smtpCommand($connection, 'RCPT TO:<' . $to . '>', 250);
    smtpCommand($connection, 'DATA', 354);

    $headers = 'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $fromEmail . '>' . "\r\n";
    $headers .= 'To: <' . $to . '>' . "\r\n";
    $headers .= 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=' . "\r\n";
    $headers .= 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

    $body = preg_replace('/\r\n|\r|\n/', "\r\n", $html);
    $body = preg_replace('/^\./m', '..', $body);

    fwrite($connection, $headers . "\r\n" . $body . "\r\n.\r\n");
    $dataResponse = smtpRead($connection);
    if (substr($dataResponse, 0, 3) !== '250') {
        throw new RuntimeException('SMTP data error: ' . trim($dataResponse));
    }

    fwrite($connection, "QUIT\r\n");
    fclose($connection);

    respond(200, ['success' => true]);
} catch (Throwable $error) {
    @fclose($connection);
    respond(502, ['error' => $error->getMessage()]);
}
