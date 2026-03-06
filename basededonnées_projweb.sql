create table users (
    id_user int not null primary key,
    nom varchar(50) not null,
    prenom varchar(50) not null,
    email varchar(100) unique not null,
    password varchar(255) not null,
    telephone varchar(20),
    adresse varchar(20),
    role varchar(10) not null,
    date_creation date,
    check (role in ('client','vendeur','chauffeur','admin'))
);
create table colis (
    id_colis int not null primary key,
    description varchar(100) not null,
    poids float(6,2) not null,
    statut varchar(20) default 'en attente',
    date_creation date,
    date_livraison date,
    id_client int not null,
    id_vendeur int not null,
    id_chauffeur int,
    check (statut in ('en attente','en cours','livré','annulé')),
    foreign key (id_client) references users(id_user),
    foreign key (id_vendeur) references users(id_user),
    foreign key (id_chauffeur) references users(id_user)
);
create table suivi_colis (
    id_suivi int not null primary key,
    id_colis int not null,
    latitude float(10,8) not null,
    longitude float(11,8) not null,
    date_position date,
    foreign key (id_colis) references colis(id_colis)
);
create table notifications (
    id_notification int not null primary key,
    message varchar(100) not null,
    date_envoi date,
    statut varchar(10) ,
    id_user int not null,
    id_colis int,
    check (statut in ('envoyee','lue')),
    foreign key (id_user) references users(id_user),
    foreign key (id_colis) references colis(id_colis)
);